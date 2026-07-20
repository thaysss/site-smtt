# app/config.py
import os
from datetime import timedelta
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env
load_dotenv()

class Config:
    """Configurações base comuns a todos os ambientes."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'chave-padrao-de-seguranca')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'chave-padrao-de-seguranca')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

class DevelopmentConfig(Config):
    """Configurações específicas para o ambiente de desenvolvimento local."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL_LOCAL', 'sqlite:///smtt_local.db')

class ProductionConfig(Config):
    """Configurações específicas para o ambiente de produção."""
    DEBUG = False
    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY') or SECRET_KEY
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')

    # Validações de segurança obrigatórias para produção
    if os.getenv('FLASK_ENV') == 'production':
        if not SECRET_KEY or SECRET_KEY == 'chave-padrao-de-seguranca':
            raise ValueError("A SECRET_KEY de produção deve ser definida no .env e não pode ser a chave padrão.")
        if not JWT_SECRET_KEY or JWT_SECRET_KEY == 'chave-padrao-de-seguranca':
            raise ValueError("A JWT_SECRET_KEY de produção deve ser definida no .env e não pode ser a chave padrão.")

class TestingConfig(Config):
    """Configurações específicas para execução de testes unitários."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'