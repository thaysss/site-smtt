# app/config.py
import os
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env
load_dotenv()

class Config:
    """Configurações base da aplicação."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'chave-padrao-de-seguranca')
    
    # Configuração do Banco de Dados (Usaremos o SQLAlchemy padrão do Flask)
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
    }