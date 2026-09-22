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
    CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '*')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 70 * 1024 * 1024))
    MAX_FORM_MEMORY_SIZE = int(os.getenv('MAX_FORM_MEMORY_SIZE', 2 * 1024 * 1024))
    MAX_FORM_PARTS = int(os.getenv('MAX_FORM_PARTS', 100))
    UPLOAD_MAX_FILE_SIZE = int(os.getenv('UPLOAD_MAX_FILE_SIZE', 10 * 1024 * 1024))
    STORAGE_BACKEND = os.getenv('STORAGE_BACKEND', 'local').lower()
    S3_BUCKET = os.getenv('S3_BUCKET')
    S3_REGION = os.getenv('S3_REGION') or os.getenv('AWS_REGION', 'us-east-1')
    S3_PREFIX = os.getenv('S3_PREFIX', 'uploads').strip('/')
    S3_ENDPOINT_URL = os.getenv('S3_ENDPOINT_URL') or None
    S3_PRESIGNED_URL_EXPIRES = int(os.getenv('S3_PRESIGNED_URL_EXPIRES', 900))
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

    @classmethod
    def validate(cls):
        """Fail fast before accepting traffic with unsafe production settings."""
        invalid = []
        if not cls.SECRET_KEY or cls.SECRET_KEY == 'chave-padrao-de-seguranca':
            invalid.append('SECRET_KEY')
        if not cls.JWT_SECRET_KEY or cls.JWT_SECRET_KEY == 'chave-padrao-de-seguranca':
            invalid.append('JWT_SECRET_KEY')
        if not cls.SQLALCHEMY_DATABASE_URI:
            invalid.append('DATABASE_URL')
        if not cls.CORS_ALLOWED_ORIGINS or cls.CORS_ALLOWED_ORIGINS == '*':
            invalid.append('CORS_ALLOWED_ORIGINS')
        if cls.STORAGE_BACKEND == 's3' and not cls.S3_BUCKET:
            invalid.append('S3_BUCKET')
        if invalid:
            raise RuntimeError('Configuração de produção inválida: ' + ', '.join(invalid))
class TestingConfig(Config):
    """Configurações específicas para execução de testes unitários."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
