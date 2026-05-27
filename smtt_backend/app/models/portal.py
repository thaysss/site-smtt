# app/models/portal.py
from app.extensions import db

class AlertaTransito(db.Model):
    __tablename__ = 'alertas_transito'
    
    id = db.Column(db.Integer, primary_key=True)
    descricao = db.Column(db.String(255), nullable=False)
    rua_bairro = db.Column(db.String(150), nullable=False)
    data_inicio = db.Column(db.DateTime, nullable=False)
    data_fim = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='Ativo')

    # Uma função para facilitar transformar o resultado em JSON depois
    def to_dict(self):
        return {
            "id": self.id,
            "descricao": self.descricao,
            "rua_bairro": self.rua_bairro,
            "status": self.status
        }