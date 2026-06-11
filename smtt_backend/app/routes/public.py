# app/routes/public.py
from flask import Blueprint, jsonify
from app.models.portal import AlertaTransito, Noticia

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
from app.models.servicos import Protocolo, RecursoMulta, AutoInfracao, SolicitacaoEvento
from flask import request
from app.extensions import db
import os
import random
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import current_app

@public_bp.route('/protocolos/<numero>', methods=['GET'])
def consultar_protocolo(numero):
    protocolo = Protocolo.query.filter_by(numero_protocolo=numero.upper()).first()
    
    if not protocolo:
        return jsonify({"erro": "Protocolo não encontrado. Verifique o número digitado."}), 404
        
    if protocolo.tipo_servico == 'Solicitação de Evento':
        evento = SolicitacaoEvento.query.filter_by(protocolo_id=protocolo.id).first()
        return jsonify({
            "numero_protocolo": protocolo.numero_protocolo,
            "data_abertura": protocolo.criado_em.strftime("%d/%m/%Y"),
            "tipo_servico": protocolo.tipo_servico,
            "status_julgamento": protocolo.status,
            "parecer_jari": evento.resposta_analise if evento else "Sua solicitação de evento está em análise pela equipe técnica da SMTT."
        }), 200
    else:
        recurso = RecursoMulta.query.filter_by(protocolo_id=protocolo.id).first()
        
        # Retorna o status do julgamento para a tela do cidadão
        return jsonify({
            "numero_protocolo": protocolo.numero_protocolo,
            "data_abertura": protocolo.criado_em.strftime("%d/%m/%Y"),
            "tipo_servico": protocolo.tipo_servico,
            "status_julgamento": recurso.resultado_julgamento if recurso else protocolo.status,
            "parecer_jari": recurso.justificativa_julgamento if recurso else "Sua defesa está em análise pela equipe técnica."
        }), 200


@public_bp.route('/solicitacao-evento', methods=['POST'])
def enviar_solicitacao_evento():
    nome = request.form.get('nome')
    cpf_cnpj = request.form.get('cpf_cnpj')
    email = request.form.get('email')
    telefone = request.form.get('telefone')
    data_evento = request.form.get('data_evento')
    local_evento = request.form.get('local_evento')
    descricao = request.form.get('descricao', '')
    
    if not (nome and cpf_cnpj and email and telefone and data_evento and local_evento):
        return jsonify({"erro": "Todos os campos obrigatórios devem ser preenchidos."}), 400
        
    arquivo = request.files.get('arquivo')
    if not arquivo or arquivo.filename == '':
        return jsonify({"erro": "O formulário de requerimento assinado é obrigatório."}), 400
        
    # Gera um número de protocolo único (Ex: EVE202606114819)
    numero_protocolo = f"EVE{datetime.now().strftime('%Y%m%d')}{random.randint(1000,9999)}"
    
    # Salva o arquivo enviado
    pasta_destino = os.path.join(current_app.root_path, 'static', 'uploads', 'eventos')
    os.makedirs(pasta_destino, exist_ok=True)
    
    nome_seguro = secure_filename(f"evento_{numero_protocolo}_{arquivo.filename}")
    caminho_arquivo = os.path.join(pasta_destino, nome_seguro)
    arquivo.save(caminho_arquivo)
    
    caminho_salvo = f"/static/uploads/eventos/{nome_seguro}"
    
    # Cria o protocolo geral (sem cidadao_id vinculando uma conta)
    novo_protocolo = Protocolo(
        numero_protocolo=numero_protocolo,
        cidadao_id=None,
        tipo_servico='Solicitação de Evento',
        status='Em Análise'
    )
    db.session.add(novo_protocolo)
    db.session.flush() # Sincroniza para obter id
    
    # Cria a solicitação do evento
    nova_solicitacao = SolicitacaoEvento(
        protocolo_id=novo_protocolo.id,
        nome_solicitante=nome,
        cpf_cnpj=cpf_cnpj,
        email=email,
        telefone=telefone,
        data_evento=data_evento,
        local_evento=local_evento,
        descricao=descricao,
        caminho_arquivo=caminho_salvo
    )
    db.session.add(nova_solicitacao)
    db.session.commit()
    
    return jsonify({
        "mensagem": "Solicitação de evento enviada com sucesso!",
        "protocolo": numero_protocolo
    }), 201

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


@public_bp.route('/noticias', methods=['GET'])
def get_noticias():
    noticias = Noticia.query.order_by(Noticia.criado_em.desc()).all()
    return jsonify([n.to_dict() for n in noticias]), 200


@public_bp.route('/noticias/<int:id>', methods=['GET'])
def get_noticia(id):
    noticia = Noticia.query.get_or_404(id)
    return jsonify(noticia.to_dict()), 200