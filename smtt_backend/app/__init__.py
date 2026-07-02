# app/__init__.py
from flask import Flask, send_from_directory
from flask_cors import CORS
from .config import Config
from .extensions import db, jwt



def create_app():
    app = Flask(__name__)
    CORS(app)
    app.config.from_object(Config)
    
    db.init_app(app)
    jwt.init_app(app) # Inicializa o gerenciador de Tokens
    
    from .routes.public import public_bp
    from .routes.auth import auth_bp
    from .routes.servicos import servicos_bp
    from .routes.admin import admin_bp
    
    
    app.register_blueprint(public_bp)
    app.register_blueprint(auth_bp)# Registra o módulo de login
    app.register_blueprint(servicos_bp) # Registra o módulo de serviços
    app.register_blueprint(admin_bp) 

    @app.route('/')
    def frontend():
        return send_from_directory(app.static_folder, 'index.html')
    
    return app
