# update_db_schema.py
from app import create_app, db
from sqlalchemy import text
import sys

app = create_app()

with app.app_context():
    try:
        print("Iniciando migração de banco de dados no Supabase...")
        
        # 1. Colunas da tabela veiculos
        print("Adicionando colunas na tabela veiculos...")
        db.session.execute(text("ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS ano_fabricacao INTEGER;"))
        db.session.execute(text("ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS marca_modelo VARCHAR(100);"))
        db.session.execute(text("ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS cor VARCHAR(50);"))
        
        # 2. Colunas da tabela autos_infracao
        print("Adicionando colunas na tabela autos_infracao...")
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
        
        # 3. Alterar tabela protocolos para permitir cidadao_id nulo (para solicitações públicas de eventos)
        print("Alterando tabela protocolos para permitir cidadao_id nulo...")
        db.session.execute(text("ALTER TABLE protocolos ALTER COLUMN cidadao_id DROP NOT NULL;"))
        
        db.session.commit()
        print("[SUCCESS] Migração concluída com sucesso no Supabase!")
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Erro na migração: {e}", file=sys.stderr)
        sys.exit(1)
