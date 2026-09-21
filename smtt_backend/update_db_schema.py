# update_db_schema.py
from app import create_app, db
from sqlalchemy import text
import sys
import os
import re

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

        # Ativa RLS em todas as tabelas da aplicacao. O Flask usa o papel
        # proprietario; outros papeis ficam sem acesso sem politica explicita.
        if db.engine.dialect.name == "postgresql":
            print("Ativando Row Level Security nas tabelas da aplicacao...")
            for table in db.metadata.sorted_tables:
                schema = table.schema or "public"
                if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", schema):
                    raise RuntimeError(f"Schema inseguro para migracao: {schema!r}")
                if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", table.name):
                    raise RuntimeError(f"Tabela insegura para migracao: {table.name!r}")
                qualified_name = f'"{schema}"."{table.name}"'
                db.session.execute(text(f"ALTER TABLE {qualified_name} ENABLE ROW LEVEL SECURITY"))

            rls_disabled = db.session.execute(text("""
                SELECT schemaname, tablename
                FROM pg_tables
                WHERE schemaname = 'public'
                  AND tablename = ANY(:table_names)
                  AND NOT rowsecurity
            """), {"table_names": [table.name for table in db.metadata.sorted_tables]}).all()
            if rls_disabled:
                raise RuntimeError(f"RLS nao foi ativado em: {rls_disabled}")
        
        db.session.commit()
        print("[SUCCESS] Migração concluída com sucesso!")
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Erro na migração: {e}", file=sys.stderr)
        sys.exit(1)
