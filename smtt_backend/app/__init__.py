# app/__init__.py
import uuid
import time
import logging
import traceback
from collections import defaultdict, deque
from threading import Lock
from flask import Flask, send_from_directory, request, g, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
import psutil

from .config import DevelopmentConfig, ProductionConfig, TestingConfig
from .extensions import db, jwt
from .utils.logging_setup import setup_logging, request_id_var
from .utils.alerts import start_alert_monitor

_rate_limit_buckets = defaultdict(deque)
_rate_limit_lock = Lock()


def _client_ip():
    forwarded = request.headers.get('X-Forwarded-For', '')
    return (forwarded.split(',')[0].strip() if forwarded else request.remote_addr) or 'unknown'


def _rate_limit_exceeded(key, limit, window_seconds):
    now = time.monotonic()
    with _rate_limit_lock:
        bucket = _rate_limit_buckets[key]
        while bucket and now - bucket[0] >= window_seconds:
            bucket.popleft()
        if len(bucket) >= limit:
            return True
        bucket.append(now)
        return False

def create_app(test_config=None):
    # 1. Initialize Structured Logging first
    setup_logging()
    
    app = Flask(__name__)
    
    import os
    env = os.getenv('FLASK_ENV', 'development')
    if env == 'production':
        ProductionConfig.validate()
        app.config.from_object(ProductionConfig)
    elif env == 'testing':
        app.config.from_object(TestingConfig)
    else:
        app.config.from_object(DevelopmentConfig)
    
    if test_config:
        app.config.update(test_config)
        
    import os
    cors_origins = app.config.get('CORS_ALLOWED_ORIGINS', '*')
    if cors_origins != '*':
        cors_origins = [origin.strip() for origin in cors_origins.split(',') if origin.strip()]
    CORS(app, origins=cors_origins, supports_credentials=False, allow_headers=['Authorization', 'Content-Type'], methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])
        
    db.init_app(app)
    
    jwt.init_app(app) # Inicializa o gerenciador de Tokens
    
    # Start the alert checker in the background
    if not app.config.get('TESTING'):
        start_alert_monitor(interval_sec=60)
    
    from .routes.public import public_bp
    from .routes.auth import auth_bp
    from .routes.servicos import servicos_bp
    from .routes.admin import admin_bp
    from .routes.health import health_bp
    
    app.register_blueprint(public_bp)
    app.register_blueprint(auth_bp) # Registra o módulo de login
    app.register_blueprint(servicos_bp) # Registra o módulo de serviços
    app.register_blueprint(admin_bp) 
    app.register_blueprint(health_bp)

    @app.route('/')
    def frontend():
        return send_from_directory(app.static_folder, 'index.html')

    # 2. Before/After Request Hooks for tracing and metrics
    @app.before_request
    def before_request():
        if request.method == 'POST' and request.path.startswith(('/api/auth/', '/api/public/')):
            honeypot = request.form.get('_website') if request.form else None
            if request.is_json:
                payload = request.get_json(silent=True)
                honeypot = payload.get('_website') if isinstance(payload, dict) else None
            if honeypot:
                return jsonify({"erro": "Requisição inválida."}), 400

        limits = {
            ('POST', '/api/auth/login'): (8, 60),
            ('POST', '/api/auth/admin/login'): (8, 60),
            ('POST', '/api/auth/cadastro'): (5, 3600),
            ('POST', '/api/public/solicitacao-evento'): (10, 3600),
            ('POST', '/api/public/solicitacao-alvara'): (10, 3600),
            ('POST', '/api/public/contestacao'): (10, 3600),
        }
        rule = limits.get((request.method, request.path))
        if request.method == 'GET' and request.path.startswith('/api/public/protocolos/'):
            rule = (30, 60)
        rate_path = '/api/public/protocolos/*' if request.path.startswith('/api/public/protocolos/') else request.path
        if rule and _rate_limit_exceeded((_client_ip(), request.method, rate_path), *rule):
            response = jsonify({"erro": "Muitas tentativas. Aguarde e tente novamente."})
            response.status_code = 429
            response.headers['Retry-After'] = str(rule[1])
            return response

        # Inject Request ID
        req_id = request.headers.get('X-Request-ID') or uuid.uuid4().hex
        g.request_id = req_id
        request_id_var.set(req_id)
        g.request_start_time = time.time()

    @app.after_request
    def after_request(response):
        response.headers.setdefault('X-Content-Type-Options', 'nosniff')
        response.headers.setdefault('X-Frame-Options', 'DENY')
        response.headers.setdefault('Referrer-Policy', 'strict-origin-when-cross-origin')
        response.headers.setdefault('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
        response.headers.setdefault('Cross-Origin-Opener-Policy', 'same-origin')
        # Uploads are rendered by the frontend hosted on a different site
        # (Vercel -> Railway). Other responses keep the stricter default.
        resource_policy = 'cross-origin' if request.path.startswith('/static/uploads/') else 'same-site'
        response.headers.setdefault('Cross-Origin-Resource-Policy', resource_policy)
        if app.config.get('ENV') == 'production' or os.getenv('FLASK_ENV') == 'production':
            response.headers.setdefault('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
        if request.path.startswith('/api/auth/'):
            response.headers.setdefault('Cache-Control', 'no-store')

        # Attach Request ID header to client response
        req_id = getattr(g, 'request_id', '-')
        response.headers['X-Request-ID'] = req_id
        
        # Performance metrics (execution duration, memory RSS, CPU percent)
        if hasattr(g, 'request_start_time'):
            duration = time.time() - g.request_start_time
            
            try:
                process = psutil.Process()
                mem_rss = process.memory_info().rss
                cpu = psutil.cpu_percent(interval=None)
            except Exception:
                mem_rss = 0
                cpu = 0.0
                
            logging.getLogger("app.request").info(
                f"HTTP request processed: {request.method} {request.path} {response.status_code}",
                extra={
                    "duration_sec": round(duration, 4),
                    "memory_rss_bytes": mem_rss,
                    "cpu_percent": cpu,
                    "status_code": response.status_code
                }
            )
            
        return response

    # 3. Global exception handler with detailed trace logging
    @app.errorhandler(Exception)
    def handle_exception(e):
        tb_text = traceback.format_exc()
        req_id = getattr(g, 'request_id', '-')
        
        is_production = os.getenv('FLASK_ENV') == 'production'
        
        if isinstance(e, HTTPException):
            code = e.code
            message = e.description
        else:
            code = 500
            message = "Erro interno do servidor. Por favor, contate o suporte." if is_production else str(e)
            
        logging.getLogger("app.error").error(
            f"Unhandled exception: {str(e)}",
            exc_info=True,
            extra={
                "stack_trace": tb_text,
                "request_id": req_id,
                "status_code": code
            }
        )
        
        response = {
            "error": e.__class__.__name__,
            "message": message,
            "request_id": req_id
        }
        if not is_production:
            response["stack_trace"] = tb_text
            
        return jsonify(response), code
    
    return app
