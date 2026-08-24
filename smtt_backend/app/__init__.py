# app/__init__.py
import uuid
import time
import logging
import traceback
from flask import Flask, send_from_directory, request, g, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
import psutil

from .config import Config, DevelopmentConfig, ProductionConfig, TestingConfig
from .extensions import db, jwt
from .utils.logging_setup import setup_logging, request_id_var
from .utils.alerts import start_alert_monitor

def create_app(test_config=None):
    # 1. Initialize Structured Logging first
    setup_logging()
    
    app = Flask(__name__)
    
    import os
    env = os.getenv('FLASK_ENV', 'development')
    if env == 'production':
        app.config.from_object(ProductionConfig)
    elif env == 'testing':
        app.config.from_object(TestingConfig)
    else:
        app.config.from_object(DevelopmentConfig)
    
    if test_config:
        app.config.update(test_config)
        
    import os
    cors_origins = os.getenv('CORS_ALLOWED_ORIGINS', '*')
    if cors_origins != '*' and ',' in cors_origins:
        cors_origins = [o.strip() for o in cors_origins.split(',')]
    CORS(app, origins=cors_origins)
        
    db.init_app(app)
    
    # Migrações automáticas de esquema de banco de dados
    with app.app_context():
        from sqlalchemy import text
        try:
            # Tabela veiculos
            db.session.execute(text("ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS ano_fabricacao INTEGER;"))
            db.session.execute(text("ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS marca_modelo VARCHAR(100);"))
            db.session.execute(text("ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS cor VARCHAR(50);"))
            db.session.execute(text("ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS uf VARCHAR(2) DEFAULT 'SE';"))
            
            # Tabela autos_infracao
            db.session.execute(text("ALTER TABLE autos_infracao ADD COLUMN IF NOT EXISTS agente_aparelho VARCHAR(50);"))
            db.session.execute(text("ALTER TABLE autos_infracao ADD COLUMN IF NOT EXISTS desdobramento VARCHAR(10) DEFAULT '1';"))
            db.session.execute(text("ALTER TABLE autos_infracao ADD COLUMN IF NOT EXISTS medicao_aferida VARCHAR(30);"))
            db.session.execute(text("ALTER TABLE autos_infracao ADD COLUMN IF NOT EXISTS medicao_considerada VARCHAR(30);"))
            db.session.execute(text("ALTER TABLE autos_infracao ADD COLUMN IF NOT EXISTS medicao_regulamentada VARCHAR(30);"))
            db.session.execute(text("ALTER TABLE autos_infracao ADD COLUMN IF NOT EXISTS codigo_renainf VARCHAR(30);"))
            db.session.execute(text("ALTER TABLE autos_infracao ADD COLUMN IF NOT EXISTS numero_nait VARCHAR(30);"))
            db.session.execute(text("ALTER TABLE autos_infracao ADD COLUMN IF NOT EXISTS numero_nip VARCHAR(30);"))
            db.session.execute(text("ALTER TABLE autos_infracao ADD COLUMN IF NOT EXISTS data_expedicao DATE;"))
            db.session.execute(text("ALTER TABLE autos_infracao ADD COLUMN IF NOT EXISTS linha_digitavel VARCHAR(100);"))
            db.session.execute(text("ALTER TABLE autos_infracao ADD COLUMN IF NOT EXISTS nosso_numero VARCHAR(50);"))
            db.session.execute(text("ALTER TABLE autos_infracao ADD COLUMN IF NOT EXISTS data_vencimento_boleto DATE;"))
            
            db.session.commit()
            logging.getLogger("app.info").info("Migrações automáticas de banco executadas com sucesso!")
        except Exception as e:
            db.session.rollback()
            logging.getLogger("app.error").error(f"Erro na migração automática de banco de dados: {e}")

    jwt.init_app(app) # Inicializa o gerenciador de Tokens
    
    # Start the alert checker in the background
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
        # Inject Request ID
        req_id = request.headers.get('X-Request-ID') or uuid.uuid4().hex
        g.request_id = req_id
        request_id_var.set(req_id)
        g.request_start_time = time.time()

    @app.after_request
    def after_request(response):
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
