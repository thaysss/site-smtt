# init_db.py
from app import create_app, db
import sys

app = create_app()

with app.app_context():
    try:
        print("Sincronizando tabelas com o banco de dados...")
        db.create_all()
        print("[SUCCESS] Tabelas sincronizadas com sucesso no Supabase!")
    except Exception as e:
        print(f"[ERROR] Erro ao inicializar tabelas: {e}", file=sys.stderr)
        sys.exit(1)
