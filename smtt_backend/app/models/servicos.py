# app/models/servicos.py
from app.extensions import db
from datetime import datetime

class Veiculo(db.Model):
    __tablename__ = 'veiculos'
    
    id = db.Column(db.Integer, primary_key=True)
    placa = db.Column(db.String(7), unique=True, nullable=False)
    renavam = db.Column(db.String(11), unique=True, nullable=True)
    cidadao_id = db.Column(db.Integer, db.ForeignKey('cidadaos.id'), nullable=True)


class AutoInfracao(db.Model):
    __tablename__ = 'autos_infracao'
    
    id = db.Column(db.Integer, primary_key=True)
    numero_ait = db.Column(db.String(20), unique=True, nullable=False)
    veiculo_id = db.Column(db.Integer, db.ForeignKey('veiculos.id'), nullable=False)
    veiculo = db.relationship('Veiculo', backref='multas_registradas', lazy=True)
    codigo_infracao = db.Column(db.String(20), db.ForeignKey('tipos_infracao_ctb.codigo_infracao'))
    tipo = db.relationship('TipoInfracaoCTB', backref='infracoes', lazy=True)
    
    # Campos atualizados para corresponder ao teu Supabase
    data_hora_infracao = db.Column(db.DateTime, nullable=False)
    local_cometimento = db.Column(db.String(255), nullable=False)
    fase_atual = db.Column(db.String(50), default='Autuação')
    valor_final = db.Column(db.Numeric(10, 2))
    data_vencimento_defesa = db.Column(db.Date, nullable=True)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
     # Novo campo para controle de vencimento da defesa prévia

    def to_dict(self):
        return {
            "numero_ait": self.numero_ait,
            "data_hora_infracao": self.data_hora_infracao.strftime("%d/%m/%Y %H:%M"),
            "local_cometimento": self.local_cometimento,
            "fase_atual": self.fase_atual,
            "valor_final": float(self.valor_final) if self.valor_final else None,
            "tipo_infracao": self.tipo.to_dict() if self.tipo else None
        }

class Protocolo(db.Model):
    __tablename__ = 'protocolos'
    
    id = db.Column(db.Integer, primary_key=True)
    numero_protocolo = db.Column(db.String(20), unique=True, nullable=False)
    cidadao_id = db.Column(db.Integer, db.ForeignKey('cidadaos.id'), nullable=False)
    tipo_servico = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), default='Em Análise')
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)


class RecursoMulta(db.Model):
    __tablename__ = 'recursos_multas'
    
    id = db.Column(db.Integer, primary_key=True)
    auto_infracao_id = db.Column(db.Integer, db.ForeignKey('autos_infracao.id'), nullable=False)
    protocolo_id = db.Column(db.Integer, db.ForeignKey('protocolos.id'), nullable=False)
    
    # Campos que você já tem no banco
    tipo_recurso = db.Column(db.String(50), nullable=False)
    condutor_indicado_cpf = db.Column(db.String(11))
    condutor_indicado_cnh = db.Column(db.String(15))
    resultado_julgamento = db.Column(db.String(30), default='Em Análise')
    justificativa_julgamento = db.Column(db.Text)
    data_julgamento = db.Column(db.Date)
    protocolo = db.relationship('Protocolo', backref='recurso_jari', lazy=True)
    infracao = db.relationship('AutoInfracao', backref='recurso_jari', lazy=True)
    anexo_resposta_jari = db.Column(db.String(255), nullable=True)
    arquivo_recurso_cidadao = db.Column(db.String(255), nullable=True)
    
# Adicione em app/models/servicos.py
class TipoInfracaoCTB(db.Model):
    __tablename__ = 'tipos_infracao_ctb'
    
    codigo_infracao = db.Column(db.String(20), primary_key=True)
    descricao = db.Column(db.Text, nullable=False)
    amparo_legal = db.Column(db.String(100))
    gravidade = db.Column(db.String(50))
    pontos = db.Column(db.Integer)
    valor_base = db.Column(db.Numeric(10, 2))
    competencia = db.Column(db.String(50))

