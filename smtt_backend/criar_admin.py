# criar_admin.py
import os
from app import create_app, db
from app.models.servidor import Servidor
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env
load_dotenv()


app = create_app()

with app.app_context():
    # Parâmetros customizáveis via variáveis de ambiente para produção
    admin_matricula = os.getenv('INITIAL_ADMIN_MATRICULA')
    admin_nome = os.getenv('INITIAL_ADMIN_NOME', 'Inspetor Chefe')
    admin_cargo = os.getenv('INITIAL_ADMIN_CARGO', 'Administrador')
    admin_senha = os.getenv('INITIAL_ADMIN_PASSWORD')
    if not admin_matricula or not admin_senha or len(admin_senha) < 12:
        raise RuntimeError('Defina INITIAL_ADMIN_MATRICULA e uma INITIAL_ADMIN_PASSWORD com pelo menos 12 caracteres.')

    # Verifica se o servidor já existe pela matrícula para não duplicar
    servidor_existente = Servidor.query.filter_by(matricula=admin_matricula).first()
    
    if not servidor_existente:
        novo_servidor = Servidor(
            nome=admin_nome,
            matricula=admin_matricula,
            cargo=admin_cargo
        )
        novo_servidor.set_senha(admin_senha) 
        
        db.session.add(novo_servidor)
        db.session.commit()
        db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        env = os.getenv('FLASK_ENV', 'development')
        if env == 'production' or 'supabase' in db_uri:
            print("[SUCCESS] Conta de servidor criada com sucesso no Supabase (Producao)!")
        elif 'sqlite' in db_uri:
            print("[SUCCESS] Conta de servidor criada com sucesso no SQLite Local!")
        else:
            print("[SUCCESS] Conta de servidor criada com sucesso no PostgreSQL Local!")
    else:
        if servidor_existente.cargo != admin_cargo:
            servidor_existente.cargo = admin_cargo
            db.session.commit()
            print("[INFO] Cargo da conta inicial atualizado.")
        else:
            print("[INFO] O servidor com esta matricula ja existe no banco de dados.")
