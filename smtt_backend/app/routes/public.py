# app/routes/public.py
from flask import Blueprint, jsonify
from app.models.portal import AlertaTransito

# Cria o Blueprint chamado 'public'
public_bp = Blueprint('public', __name__, url_prefix='/api/public')

@public_bp.route('/alertas', methods=['GET'])
def get_alertas():
    # Consulta no banco: SELECT * FROM alertas_transito WHERE status = 'Ativo'
    alertas_ativos = AlertaTransito.query.filter_by(status='Ativo').all()
    
    # Transforma a lista de objetos do banco em uma lista de dicionários (JSON)
    resultado = [alerta.to_dict() for alerta in alertas_ativos]
    
    return jsonify(resultado), 200

# app/routes/public.py (Adicione os imports necessários no topo se faltar)
from app.models.servicos import Protocolo, RecursoMulta, AutoInfracao

@public_bp.route('/protocolos/<numero>', methods=['GET'])
def consultar_protocolo(numero):
    protocolo = Protocolo.query.filter_by(numero_protocolo=numero.upper()).first()
    
    if not protocolo:
        return jsonify({"erro": "Protocolo não encontrado. Verifique o número digitado."}), 404
        
    recurso = RecursoMulta.query.filter_by(protocolo_id=protocolo.id).first()
    
    # Retorna o status do julgamento para a tela do cidadão
    return jsonify({
        "numero_protocolo": protocolo.numero_protocolo,
        "data_abertura": protocolo.criado_em.strftime("%d/%m/%Y"),
        "status_julgamento": recurso.resultado_julgamento,
        "parecer_jari": recurso.justificativa_julgamento
    }), 200

# app/routes/public.py (Adicione no final do arquivo)
from flask import request
from app.models.servicos import Veiculo, AutoInfracao

@public_bp.route('/consulta-placa', methods=['POST'])
def consulta_publica_placa():
    dados = request.get_json()
    placa = dados.get('placa', '').upper()
    
    veiculo = Veiculo.query.filter_by(placa=placa).first()
    
    # Se o veículo não existe, obviamente não tem multas
    if not veiculo:
        return jsonify({"tem_multas": False, "mensagem": "Nenhum registro de infração encontrado para esta placa."}), 200
        
    # Se o veículo existe, conta as infrações associadas a ele
    infracoes = AutoInfracao.query.filter_by(veiculo_id=veiculo.id).all()
    
    if not infracoes:
         return jsonify({"tem_multas": False, "mensagem": "Nenhuma infração pendente encontrada para esta placa."}), 200
         
    return jsonify({
        "tem_multas": True,
        "quantidade": len(infracoes),
        "mensagem": f"Atenção: Encontramos {len(infracoes)} infração(ões) registrada(s) para a placa {placa}."
    }), 200