# app/config.py
import os
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env
load_dotenv()

class Config:
    """Configurações base comuns a todos os ambientes."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'chave-padrao-de-seguranca')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

class DevelopmentConfig(Config):
    """Configurações específicas para o ambiente de desenvolvimento local."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')

class ProductionConfig(Config):
    """Configurações específicas para o ambiente de produção."""
    DEBUG = False
    SECRET_KEY = os.getenv('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')

class TestingConfig(Config):
    """Configurações específicas para execução de testes unitários."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'