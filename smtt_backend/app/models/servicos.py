# app/models/servicos.py
from app.extensions import db
from datetime import datetime

class Veiculo(db.Model):
    __tablename__ = 'veiculos'
    
    id = db.Column(db.Integer, primary_key=True)
    placa = db.Column(db.String(7), unique=True, nullable=False)
    renavam = db.Column(db.String(11), unique=True, nullable=True)
    cidadao_id = db.Column(db.Integer, db.ForeignKey('cidadaos.id'), nullable=True)
    
    # Novos campos do veículo
    ano_fabricacao = db.Column(db.Integer, nullable=True)
    marca_modelo = db.Column(db.String(100), nullable=True)
    cor = db.Column(db.String(50), nullable=True)


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
    
    # Novos campos legais e fiscais da notificação
    agente_aparelho = db.Column(db.String(50), nullable=True)
    desdobramento = db.Column(db.String(10), default='1')
    medicao_aferida = db.Column(db.String(30), nullable=True)
    medicao_considerada = db.Column(db.String(30), nullable=True)
    medicao_regulamentada = db.Column(db.String(30), nullable=True)
    codigo_renainf = db.Column(db.String(30), nullable=True)
    numero_nait = db.Column(db.String(30), nullable=True)
    numero_nip = db.Column(db.String(30), nullable=True)
    data_expedicao = db.Column(db.Date, nullable=True)
    linha_digitavel = db.Column(db.String(100), nullable=True)
    nosso_numero = db.Column(db.String(50), nullable=True)
    data_vencimento_boleto = db.Column(db.Date, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "numero_ait": self.numero_ait,
            "data_hora_infracao": self.data_hora_infracao.strftime("%d/%m/%Y %H:%M"),
            "local_cometimento": self.local_cometimento,
            "fase_atual": self.fase_atual,
            "valor_final": float(self.valor_final) if self.valor_final else None,
            "tipo_infracao": self.tipo.to_dict() if self.tipo else None,
            "data_vencimento_defesa": self.data_vencimento_defesa.strftime("%d/%m/%Y") if self.data_vencimento_defesa else None,
            
            # Novos campos expostos
            "agente_aparelho": self.agente_aparelho,
            "desdobramento": self.desdobramento,
            "medicao_aferida": self.medicao_aferida,
            "medicao_considerada": self.medicao_considerada,
            "medicao_regulamentada": self.medicao_regulamentada,
            "codigo_renainf": self.codigo_renainf,
            "numero_nait": self.numero_nait,
            "numero_nip": self.numero_nip,
            "data_expedicao": self.data_expedicao.strftime("%d/%m/%Y") if self.data_expedicao else None,
            "linha_digitavel": self.linha_digitavel,
            "nosso_numero": self.nosso_numero,
            "data_vencimento_boleto": self.data_vencimento_boleto.strftime("%d/%m/%Y") if self.data_vencimento_boleto else None,
            "veiculo": {
                "placa": self.veiculo.placa if self.veiculo else "",
                "renavam": self.veiculo.renavam if self.veiculo else "",
                "ano_fabricacao": self.veiculo.ano_fabricacao if self.veiculo else None,
                "marca_modelo": self.veiculo.marca_modelo if self.veiculo else "",
                "cor": self.veiculo.cor if self.veiculo else ""
            }
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

class RecursoAnexo(db.Model):
    __tablename__ = 'recursos_anexos'
    
    id = db.Column(db.Integer, primary_key=True)
    recurso_id = db.Column(db.Integer, db.ForeignKey('recursos_multas.id'), nullable=False)
    caminho_arquivo = db.Column(db.String(255), nullable=False)
    nome_original = db.Column(db.String(150), nullable=True)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
    
    recurso = db.relationship('RecursoMulta', backref=db.backref('anexos', lazy=True, cascade="all, delete-orphan"))

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

    def to_dict(self):
        return {
            "codigo_infracao": self.codigo_infracao,
            "descricao": self.descricao,
            "amparo_legal": self.amparo_legal,
            "gravidade": self.gravidade,
            "pontos": self.pontos,
            "valor_base": float(self.valor_base) if self.valor_base else 0.0,
            "competencia": self.competencia
        }


class SolicitacaoEvento(db.Model):
    __tablename__ = 'solicitacoes_eventos'
    
    id = db.Column(db.Integer, primary_key=True)
    protocolo_id = db.Column(db.Integer, db.ForeignKey('protocolos.id'), nullable=False)
    nome_solicitante = db.Column(db.String(150), nullable=False)
    cpf_cnpj = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    telefone = db.Column(db.String(20), nullable=False)
    data_evento = db.Column(db.String(50), nullable=False)
    local_evento = db.Column(db.String(255), nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    caminho_arquivo = db.Column(db.String(255), nullable=False)
    resposta_analise = db.Column(db.Text, default='Sua solicitação de evento está em análise pela equipe técnica da SMTT.')
    
    protocolo = db.relationship('Protocolo', backref=db.backref('evento', uselist=False), lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "protocolo_id": self.protocolo_id,
            "nome_solicitante": self.nome_solicitante,
            "cpf_cnpj": self.cpf_cnpj,
            "email": self.email,
            "telefone": self.telefone,
            "data_evento": self.data_evento,
            "local_evento": self.local_evento,
            "descricao": self.descricao,
            "caminho_arquivo": self.caminho_arquivo,
            "resposta_analise": self.resposta_analise,
            "numero_protocolo": self.protocolo.numero_protocolo if self.protocolo else None,
            "status": self.protocolo.status if self.protocolo else None,
            "criado_em": self.protocolo.criado_em.strftime("%d/%m/%Y") if self.protocolo else None
        }


