# app/routes/servicos.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.servicos import Veiculo, AutoInfracao, RecursoMulta, Protocolo
import random
from datetime import datetime

servicos_bp = Blueprint('servicos', __name__, url_prefix='/api/servicos')

# ==========================================
# 1. GESTÃO DE VEÍCULOS (Cidadão)
# ==========================================
@servicos_bp.route('/veiculos', methods=['GET'])
@jwt_required()
def listar_meus_veiculos():
    cidadao_id = get_jwt_identity()
    # Busca apenas os veículos vinculados a este cidadão
    veiculos = Veiculo.query.filter_by(cidadao_id=cidadao_id).all()
    
    return jsonify([{"id": v.id, "placa": v.placa, "renavam": v.renavam} for v in veiculos]), 200

@servicos_bp.route('/veiculos', methods=['POST'])
@jwt_required()
def vincular_veiculo():
    dados = request.get_json()
    cidadao_id = get_jwt_identity()
    
    placa = dados.get('placa', '').upper()
    renavam = dados.get('renavam', '')
    
    # 1. Procura o veículo APENAS pela placa
    veiculo = Veiculo.query.filter_by(placa=placa).first()
    
    if veiculo:
        # Se o veículo já tem um dono e não é o usuário logado
        if veiculo.cidadao_id and str(veiculo.cidadao_id) != str(cidadao_id):
            return jsonify({"erro": "Este veículo já está vinculado a outro cidadão."}), 400
            
        # Se já está vinculado a este mesmo usuário
        if veiculo.cidadao_id and str(veiculo.cidadao_id) == str(cidadao_id):
            return jsonify({"erro": "Este veículo já está vinculado à sua conta."}), 400
            
        # Verifica se o Renavam confere (caso o banco já tenha um Renavam salvo pelo Detran)
        if veiculo.renavam and veiculo.renavam != renavam:
            return jsonify({"erro": "Renavam incorreto para esta placa."}), 400
            
        # Atualiza os dados: Grava o renavam e vincula o carro ao cidadão
        veiculo.renavam = renavam
        veiculo.cidadao_id = cidadao_id
    else:
        # Se o carro nunca tomou multa e não existe na base, cria ele já vinculado ao cidadão
        veiculo = Veiculo(
            placa=placa, 
            renavam=renavam, 
            cidadao_id=cidadao_id
        )
        db.session.add(veiculo)
        
    db.session.commit()
    return jsonify({"mensagem": "Veículo vinculado com sucesso ao seu perfil!"}), 200


# ==========================================
# 2. CONSULTA DE INFRAÇÕES
# ==========================================
@servicos_bp.route('/infracoes', methods=['GET'])
@jwt_required()
def listar_minhas_infracoes():
    cidadao_id = get_jwt_identity()
    
    # Descobre quais são os carros deste cidadão
    veiculos = Veiculo.query.filter_by(cidadao_id=cidadao_id).all()
    veiculo_ids = [v.id for v in veiculos]
    
    if not veiculo_ids:
        return jsonify([]), 200 # Não tem carros, não tem multas
        
    # Busca multas que pertençam aos carros dele
    infracoes = AutoInfracao.query.filter(AutoInfracao.veiculo_id.in_(veiculo_ids)).all()
    
    lista = []
    for inf in infracoes:
        lista.append({
            "id": inf.id,
            "numero_ait": inf.numero_ait,
            "placa_veiculo": inf.veiculo.placa,
            "data_hora_infracao": inf.data_hora_infracao.strftime("%d/%m/%Y %H:%M"),
            "local_cometimento": inf.local_cometimento,
            "valor_final": f"{inf.valor_final:.2f}",
            "fase_atual": inf.fase_atual
        })
        
    return jsonify(lista), 200


# ==========================================
# 3. ABERTURA DE RECURSO JARI
# ==========================================
@servicos_bp.route('/infracoes/<int:id>/recurso', methods=['POST'])
@jwt_required()
def abrir_recurso(id):
    cidadao_id = get_jwt_identity()
    infracao = AutoInfracao.query.get_or_404(id)
    
    # Gera um número de protocolo único (Ex: JARI202605271234)
    numero_protocolo = f"JARI{datetime.now().strftime('%Y%m%d')}{random.randint(1000,9999)}"
    
    # Cria o Protocolo Base
    novo_protocolo = Protocolo(
        numero_protocolo=numero_protocolo,
        cidadao_id=cidadao_id,
        tipo_servico='Recurso JARI',
        status='Em Análise'
    )
    db.session.add(novo_protocolo)
    db.session.flush() # Salva temporariamente para pegar o ID gerado
    
    # Cria o Recurso atrelado à multa e ao protocolo
    import os
    from werkzeug.utils import secure_filename
    from flask import current_app

    # Lógica para salvar o arquivo do cidadão
    caminho_salvo = None
    arquivo = request.files.get('arquivo_recurso') # Pega o arquivo do React
    
    if arquivo and arquivo.filename != '':
        # Salva numa subpasta 'cidadao' para organizar
        pasta_destino = os.path.join(current_app.root_path, 'static', 'uploads', 'cidadao')
        os.makedirs(pasta_destino, exist_ok=True)
        
        nome_seguro = secure_filename(f"req_{numero_protocolo}_{arquivo.filename}")
        caminho_arquivo = os.path.join(pasta_destino, nome_seguro)
        arquivo.save(caminho_arquivo)
        
        caminho_salvo = f"/static/uploads/cidadao/{nome_seguro}"

    # Cria o Recurso vinculando o arquivo
    novo_recurso = RecursoMulta(
        auto_infracao_id=infracao.id,
        protocolo_id=novo_protocolo.id,
        tipo_recurso='Defesa Prévia',
        resultado_julgamento='Em Análise',
        arquivo_recurso_cidadao=caminho_salvo  # 👉 Grava o link no banco!
    )
    
    db.session.add(novo_recurso)
    
    # Atualiza a fase da infração (Mantenha o seu código)
    infracao.fase_atual = 'Em Recurso'
    
    db.session.commit()

    return jsonify({
        "mensagem": "Recurso enviado com sucesso!",
        "protocolo": numero_protocolo
    }), 201