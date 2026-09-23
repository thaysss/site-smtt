# app/models/cidadao.py
from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class Cidadao(db.Model):
    __tablename__ = 'cidadaos'
    
    id = db.Column(db.Integer, primary_key=True)
    nome_completo = db.Column(db.String(150), nullable=False)
    cpf = db.Column(db.String(11), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    senha_hash = db.Column(db.String(255), nullable=False)
    telefone = db.Column(db.String(20))
    endereco = db.Column(db.Text)

    def set_senha(self, senha):
        self.senha_hash = generate_password_hash(senha)

    def verificar_senha(self, senha):
        return check_password_hash(self.senha_hash, senha)


class CodigoVerificacao(db.Model):
    __tablename__ = 'codigos_verificacao'
    id = db.Column(db.Integer, primary_key=True)
    finalidade = db.Column(db.String(20), nullable=False, index=True)
    cpf = db.Column(db.String(11), nullable=False, index=True)
    email = db.Column(db.String(100), nullable=False)
    codigo_hash = db.Column(db.String(255), nullable=False)
    expira_em = db.Column(db.DateTime, nullable=False)
    usado_em = db.Column(db.DateTime)
    tentativas = db.Column(db.Integer, nullable=False, default=0)
    criado_em = db.Column(db.DateTime, nullable=False, default=datetime.now)
    nome_completo = db.Column(db.String(150))
    telefone = db.Column(db.String(20))
    endereco = db.Column(db.String(255))
    senha_hash = db.Column(db.String(255))
