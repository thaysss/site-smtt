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
        
        # 4. Colunas da tabela noticias
        print("Adicionando colunas na tabela noticias...")
        db.session.execute(text("ALTER TABLE noticias ADD COLUMN IF NOT EXISTS subtitulo VARCHAR(255);"))
        db.session.execute(text("ALTER TABLE noticias ADD COLUMN IF NOT EXISTS categoria VARCHAR(100) DEFAULT 'Geral';"))
        db.session.execute(text("ALTER TABLE noticias ADD COLUMN IF NOT EXISTS imagem_url VARCHAR(255);"))
        db.session.execute(text("ALTER TABLE noticias ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());"))
        
        # 5. Criar e alimentar tabela estatisticas
        print("Criando e alimentando a tabela estatisticas...")
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS estatisticas (
                id SERIAL PRIMARY KEY,
                titulo VARCHAR(100) NOT NULL,
                valor VARCHAR(50) NOT NULL,
                icone VARCHAR(50) DEFAULT 'fa-chart-simple',
                ordem INTEGER DEFAULT 0
            );
        """))
        
        # Semeia dados padrão apenas se a tabela estiver vazia
        result = db.session.execute(text("SELECT COUNT(*) FROM estatisticas;")).scalar()
        if result == 0:
            print("Inserindo dados iniciais em estatisticas...")
            db.session.execute(text("""
                INSERT INTO estatisticas (titulo, valor, icone, ordem) VALUES
                ('Veículos Fiscalizados/Mês', '150k+', 'fa-car', 1),
                ('Atendimentos Online', '12k', 'fa-laptop', 2),
                ('Acidentes neste ano', '-15%', 'fa-car-burst', 3),
                ('Acidentes com vítimas fatais', '45', 'fa-heart-crack', 4);
            """))
        # 6. Coluna caminho_alvara_emitido na tabela solicitacoes_alvara
        print("Adicionando coluna caminho_alvara_emitido na tabela solicitacoes_alvara...")
        db.session.execute(text("ALTER TABLE solicitacoes_alvara ADD COLUMN IF NOT EXISTS caminho_alvara_emitido VARCHAR(255);"))
        
        db.session.commit()
        print("[SUCCESS] Migração concluída com sucesso no Supabase!")
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Erro na migração: {e}", file=sys.stderr)
        sys.exit(1)
