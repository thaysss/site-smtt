# app/routes/admin.py
import os
from werkzeug.utils import secure_filename
from flask import Blueprint, jsonify, request, current_app
from app.extensions import db
from app.models.servicos import Veiculo, AutoInfracao, RecursoMulta, Protocolo, TipoInfracaoCTB
from app.models.portal import AlertaTransito
from datetime import datetime
import random

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# ==========================================
# 1. INFRAÇÕES (Lançamento de Multas)
# ==========================================
@admin_bp.route('/infracoes', methods=['POST'])
def registrar_infracao():
    dados = request.get_json()
    placa = dados.get('placa', '').upper()
    codigo_ctb = dados.get('codigo_infracao')
    
    # 1. Verifica ou cria o Veículo
    veiculo = Veiculo.query.filter_by(placa=placa).first()
    if not veiculo:
        veiculo = Veiculo(placa=placa)
        db.session.add(veiculo)
        db.session.flush() 
        
    # 2. Verifica ou cria o TIPO de Infração (Evita erro de Foreign Key no Supabase)
    tipo_infracao = TipoInfracaoCTB.query.filter_by(codigo_infracao=codigo_ctb).first()
    if not tipo_infracao:
        tipo_infracao = TipoInfracaoCTB(
            codigo_infracao=codigo_ctb,
            descricao=dados.get('descricao_infracao', 'Descrição não informada'),
            gravidade=dados.get('gravidade', 'Média'),
            pontos=int(dados.get('pontos', 4)),
            valor_base=float(dados.get('valor_final', 130.16))
        )
        db.session.add(tipo_infracao)
        db.session.flush()

    numero_gerado = f"AIT{random.randint(100000, 999999)}"
    
    try:
        data_hora_infracao = datetime.strptime(dados['data_hora_infracao'], "%Y-%m-%d %H:%M:%S")
        data_vencimento = None
        if dados.get('data_vencimento_defesa'):
            data_vencimento = datetime.strptime(dados['data_vencimento_defesa'], "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"erro": "Formato de data inválido."}), 400
    
    # 3. Grava o Auto de Infração
    nova_infracao = AutoInfracao(
        numero_ait=numero_gerado,
        veiculo_id=veiculo.id, 
        data_hora_infracao=data_hora_infracao,
        local_cometimento=dados.get('local_cometimento', 'Local não informado'),
        valor_final=dados.get('valor_final', 130.16),
        codigo_infracao=codigo_ctb,
        data_vencimento_defesa=data_vencimento
    )
    
    db.session.add(nova_infracao)
    db.session.commit()
    
    return jsonify({
        "mensagem": "Infração registrada com sucesso pelo equipamento/agente!",
        "numero_ait": numero_gerado
    }), 201


# ==========================================
# 2. RECURSOS JARI (Análise e Julgamento)
# ==========================================
@admin_bp.route('/recursos', methods=['GET'])
def listar_recursos():
    recursos = RecursoMulta.query.all()
    resultado = []
    
    for r in recursos:
        resultado.append({
            "id": r.id,
            "resultado_julgamento": r.resultado_julgamento,
            "protocolo": {"numero_protocolo": r.protocolo.numero_protocolo} if r.protocolo else {},
            "infracao": {
                "numero_ait": r.infracao.numero_ait if r.infracao else "N/A",
                "placa_veiculo": r.infracao.veiculo.placa if r.infracao and r.infracao.veiculo else "N/A"
            }
        })
    return jsonify(resultado), 200

@admin_bp.route('/recursos/<int:id>/julgar', methods=['PUT'])
def julgar_recurso(id):
    recurso = RecursoMulta.query.get_or_404(id)
    
    # Como agora enviamos arquivo, usamos request.form em vez de request.get_json()
    decisao = request.form.get('decisao')
    justificativa = request.form.get('justificativa_jari')
    
    # LÓGICA DE UPLOAD DE ARQUIVO
    arquivo = request.files.get('arquivo_resposta')
    if arquivo and arquivo.filename != '':
        # 1. Cria a pasta 'uploads' dentro de 'app/static' caso não exista
        pasta_destino = os.path.join(current_app.root_path, 'static', 'uploads')
        os.makedirs(pasta_destino, exist_ok=True)
        
        # 2. Limpa o nome do arquivo (tira espaços e caracteres especiais) e salva
        nome_seguro = secure_filename(f"resposta_{id}_{arquivo.filename}")
        caminho_arquivo = os.path.join(pasta_destino, nome_seguro)
        arquivo.save(caminho_arquivo)
        
        # 3. Guarda o link no banco de dados
        recurso.anexo_resposta_jari = f"/static/uploads/{nome_seguro}"

    # Atualiza as informações normais do julgamento
    recurso.resultado_julgamento = decisao
    recurso.justificativa_julgamento = justificativa
    recurso.data_julgamento = datetime.utcnow()
    
    if recurso.protocolo:
        recurso.protocolo.status = 'Concluído'
        
    if recurso.infracao:
        if decisao == 'Deferido':
            recurso.infracao.fase_atual = 'Defesa Deferida (Cancelada)'
        elif decisao == 'Indeferido':
            recurso.infracao.fase_atual = 'Defesa Indeferida'
            
    db.session.commit()
    
    return jsonify({"mensagem": "Julgamento e anexos registrados com sucesso!"}), 200


# ==========================================
# 3. VEÍCULOS (Detran Municipal)
# ==========================================
@admin_bp.route('/veiculos', methods=['POST'])
def registrar_veiculo_frota():
    dados = request.get_json()
    placa = dados.get('placa', '').upper()
    
    if Veiculo.query.filter_by(placa=placa).first():
        return jsonify({"erro": "Este veículo já está cadastrado na frota municipal."}), 400
        
    novo_veiculo = Veiculo(
        placa=placa,
        renavam=dados.get('renavam')
    )
    db.session.add(novo_veiculo)
    db.session.commit()
    
    return jsonify({"mensagem": "Veículo adicionado à base do município com sucesso!"}), 201


# ==========================================
# 4. GESTÃO DE ALERTAS (Vias Interditadas)
# ==========================================
@admin_bp.route('/alertas', methods=['GET'])
def listar_alertas_admin():
    alertas = AlertaTransito.query.order_by(AlertaTransito.id.desc()).all()
    return jsonify([a.to_dict() for a in alertas]), 200

@admin_bp.route('/alertas', methods=['POST'])
def publicar_alerta():
    dados = request.get_json()
    novo_alerta = AlertaTransito(
        rua_bairro=dados.get('rua_bairro'),
        descricao=dados.get('descricao'),
        data_inicio=datetime.utcnow(),
        status='Ativo'
    )
    db.session.add(novo_alerta)
    db.session.commit()
    return jsonify({"mensagem": "Alerta publicado com sucesso!"}), 201

@admin_bp.route('/alertas/<int:alerta_id>/resolver', methods=['PUT'])
def resolver_alerta(alerta_id):
    alerta = AlertaTransito.query.get(alerta_id)
    if not alerta:
        return jsonify({"erro": "Alerta não encontrado"}), 404
        
    alerta.status = 'Resolvido'
    alerta.data_fim = datetime.utcnow()
    db.session.commit()
    return jsonify({"mensagem": "Alerta resolvido e removido do site."}), 200