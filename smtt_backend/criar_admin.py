# criar_admin.py
from app import create_app, db
from app.models.servidor import Servidor

app = create_app()

with app.app_context():
    # Verifica se o servidor já existe pela matrícula para não duplicar
    servidor_existente = Servidor.query.filter_by(matricula='admin123').first()
    
    if not servidor_existente:
        novo_servidor = Servidor(
            nome='Inspetor Chefe',
            matricula='admin123',
            cargo='Agente de Trânsito' # Adicionando o cargo que você criou no modelo
        )
        novo_servidor.set_senha('senha123') 
        
        db.session.add(novo_servidor)
        db.session.commit()
        print("✅ Conta de servidor criada com sucesso no Supabase!")
    else:
        print("⚠️ O servidor com esta matrícula já existe no banco de dados.")