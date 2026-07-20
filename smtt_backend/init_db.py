# init_db.py
from app import create_app, db
import sys
import os

app = create_app()

with app.app_context():
    try:
        db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        env = os.getenv('FLASK_ENV', 'development')
        
        print(f"Sincronizando tabelas com o banco de dados em ambiente de '{env}'...")
        db.create_all()
        
        if env == 'production' or 'supabase' in db_uri:
            print("[SUCCESS] Tabelas sincronizadas com sucesso no Supabase (Produção)!")
        elif 'sqlite' in db_uri:
            print(f"[SUCCESS] Tabelas sincronizadas com sucesso no SQLite Local ({db_uri})!")
        else:
            print(f"[SUCCESS] Tabelas sincronizadas com sucesso no PostgreSQL Local ({db_uri})!")
    except Exception as e:
        print(f"[ERROR] Erro ao inicializar tabelas: {e}", file=sys.stderr)
        sys.exit(1)
