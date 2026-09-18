# update_db_schema.py
from app import create_app, db
from sqlalchemy import text
import sys
import os

if os.getenv("RUN_DATABASE_MIGRATIONS") != "yes":
    print("Migração não executada. Defina RUN_DATABASE_MIGRATIONS=yes após revisar backup e destino.", file=sys.stderr)
    sys.exit(2)

app = create_app()

with app.app_context():
    try:
        print("Iniciando migração explícita de banco de dados...")
        
        # 1. Colunas da tabela veiculos
        print("Adicionando colunas na tabela veiculos...")
        db.session.execute(text("ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS ano_fabricacao INTEGER;"))
        db.session.execute(text("ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS marca_modelo VARCHAR(100);"))
        db.session.execute(text("ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS cor VARCHAR(50);"))
        db.session.execute(text("ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS uf VARCHAR(2) DEFAULT 'SE';"))
        
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
        
        # 4. Colunas da tabela noticias
        print("Adicionando colunas na tabela noticias...")
        db.session.execute(text("ALTER TABLE noticias ADD COLUMN IF NOT EXISTS subtitulo VARCHAR(255);"))
        db.session.execute(text("ALTER TABLE noticias ADD COLUMN IF NOT EXISTS categoria VARCHAR(100) DEFAULT 'Geral';"))
        db.session.execute(text("ALTER TABLE noticias ADD COLUMN IF NOT EXISTS imagem_url VARCHAR(255);"))
        db.session.execute(text("ALTER TABLE noticias ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());"))
        
        # 6. Coluna caminho_alvara_emitido na tabela solicitacoes_alvara
        print("Adicionando coluna caminho_alvara_emitido na tabela solicitacoes_alvara...")
        db.session.execute(text("ALTER TABLE solicitacoes_alvara ADD COLUMN IF NOT EXISTS caminho_alvara_emitido VARCHAR(255);"))
        db.session.execute(text("ALTER TABLE solicitacoes_alvara ADD COLUMN IF NOT EXISTS caminho_requerimento VARCHAR(255);"))
        
        # 7. Alterar tabela solicitacoes_eventos para permitir local_evento nulo
        print("Alterando tabela solicitacoes_eventos para permitir local_evento nulo...")
        db.session.execute(text("ALTER TABLE solicitacoes_eventos ALTER COLUMN local_evento DROP NOT NULL;"))
        db.session.execute(text("ALTER TABLE solicitacoes_eventos ADD COLUMN IF NOT EXISTS anexo_resposta VARCHAR(255);"))
        
        db.session.commit()
        print("[SUCCESS] Migração concluída com sucesso!")
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Erro na migração: {e}", file=sys.stderr)
        sys.exit(1)
