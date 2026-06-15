# app/routes/public.py
from flask import Blueprint, jsonify
from app.models.portal import AlertaTransito, Noticia, Estatistica

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
from app.models.servicos import Protocolo, RecursoMulta, AutoInfracao, SolicitacaoEvento, SolicitacaoAlvara
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
    elif protocolo.tipo_servico in ['Renovação de Alvará', 'Inclusão de Permissionário']:
        alvara = SolicitacaoAlvara.query.filter_by(protocolo_id=protocolo.id).first()
        return jsonify({
            "numero_protocolo": protocolo.numero_protocolo,
            "data_abertura": protocolo.criado_em.strftime("%d/%m/%Y"),
            "tipo_servico": protocolo.tipo_servico,
            "status_julgamento": protocolo.status,
            "parecer_jari": alvara.resposta_analise if alvara else "Sua solicitação de alvará/permissionário está em análise pela equipe técnica da SMTT.",
            "caminho_alvara_emitido": alvara.caminho_alvara_emitido if alvara else None,
            
            # Detalhes para o documento impresso
            "nome_solicitante": alvara.nome_solicitante if alvara else None,
            "cpf": alvara.cpf if alvara else None,
            "email": alvara.email if alvara else None,
            "telefone": alvara.telefone if alvara else None,
            "placa_veiculo": alvara.placa_veiculo if alvara else None,
            "fator_rh": alvara.fator_rh if alvara else None,
            "tem_auxiliar": alvara.tem_auxiliar if alvara else False,
            "nome_auxiliar": alvara.nome_auxiliar if alvara else None,
            "cpf_auxiliar": alvara.cpf_auxiliar if alvara else None
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

@public_bp.route('/estatisticas', methods=['GET'])
def get_estatisticas():
    try:
        estatisticas = Estatistica.query.order_by(Estatistica.ordem.asc(), Estatistica.id.asc()).all()
        return jsonify([e.to_dict() for e in estatisticas]), 200
    except Exception as e:
        print(f"Erro ao obter estatísticas: {e}")
        return jsonify([]), 200


@public_bp.route('/solicitacao-alvara', methods=['POST'])
def enviar_solicitacao_alvara():
    tipo_servico = request.form.get('tipo_servico') # 'Renovação de Alvará' ou 'Inclusão de Permissionário'
    nome = request.form.get('nome')
    cpf = request.form.get('cpf')
    email = request.form.get('email')
    telefone = request.form.get('telefone')
    placa_veiculo = request.form.get('placa_veiculo', '')
    fator_rh = request.form.get('fator_rh', '')
    
    tem_auxiliar = request.form.get('tem_auxiliar') == 'true'
    nome_auxiliar = request.form.get('nome_auxiliar', '')
    cpf_auxiliar = request.form.get('cpf_auxiliar', '')
    
    if not (tipo_servico and nome and cpf and email and telefone):
        return jsonify({"erro": "Preencha todos os campos obrigatórios do permissionário."}), 400
        
    # Gera um número de protocolo único
    prefixo = "ALV" if tipo_servico == 'Renovação de Alvará' else "PER"
    numero_protocolo = f"{prefixo}{datetime.now().strftime('%Y%m%d')}{random.randint(1000,9999)}"
    
    # Salvar arquivos
    pasta_destino = os.path.join(current_app.root_path, 'static', 'uploads', 'alvaras')
    os.makedirs(pasta_destino, exist_ok=True)
    
    def salvar_arquivo(campo_nome):
        arq = request.files.get(campo_nome)
        if arq and arq.filename != '':
            nome_seguro = secure_filename(f"{numero_protocolo}_{campo_nome}_{arq.filename}")
            caminho_completo = os.path.join(pasta_destino, nome_seguro)
            arq.save(caminho_completo)
            return f"/static/uploads/alvaras/{nome_seguro}"
        return None

    # Salva arquivos do permissionário
    caminho_cnh = salvar_arquivo('cnh')
    caminho_crlv = salvar_arquivo('crlv')
    caminho_titulo_eleitoral = salvar_arquivo('titulo_eleitoral')
    caminho_certidao_eleitoral = salvar_arquivo('certidao_eleitoral')
    caminho_antecedentes_criminais = salvar_arquivo('antecedentes_criminais')
    caminho_comprovante_endereco = salvar_arquivo('comprovante_endereco')
    caminho_certificado_curso = salvar_arquivo('certificado_curso')
    caminho_cadastro_cnis = salvar_arquivo('cadastro_cnis')
    caminho_regularidade_cnis = salvar_arquivo('regularidade_cnis')
    caminho_foto = salvar_arquivo('foto')
    caminho_fator_rh = salvar_arquivo('fator_rh')
    
    # Validações de arquivos obrigatórios do titular
    if not (caminho_cnh and caminho_crlv and caminho_certidao_eleitoral and caminho_antecedentes_criminais and caminho_comprovante_endereco and caminho_certificado_curso and caminho_regularidade_cnis and caminho_foto):
        return jsonify({"erro": "Algum documento obrigatório do permissionário não foi enviado (incluindo a Foto 3/4)."}), 400
        
    # Se for Inclusão, valida Título Eleitoral, Cadastro CNIS
    if tipo_servico == 'Inclusão de Permissionário':
        if not (caminho_titulo_eleitoral and caminho_cadastro_cnis):
            return jsonify({"erro": "Para inclusão de permissionário, os documentos adicionais (Título Eleitoral, Cadastro CNIS) são obrigatórios."}), 400

    # Salva arquivos do auxiliar se houver
    caminho_cnh_auxiliar = None
    caminho_crlv_auxiliar = None
    caminho_titulo_eleitoral_auxiliar = None
    caminho_certidao_eleitoral_auxiliar = None
    caminho_antecedentes_criminais_auxiliar = None
    caminho_comprovante_endereco_auxiliar = None
    caminho_certificado_curso_auxiliar = None
    caminho_cadastro_cnis_auxiliar = None
    caminho_regularidade_cnis_auxiliar = None
    caminho_foto_auxiliar = None
    caminho_fator_rh_auxiliar = None
    
    if tem_auxiliar:
        if not (nome_auxiliar and cpf_auxiliar):
            return jsonify({"erro": "Preencha o nome e CPF do condutor auxiliar."}), 400
            
        caminho_cnh_auxiliar = salvar_arquivo('cnh_auxiliar')
        caminho_crlv_auxiliar = salvar_arquivo('crlv_auxiliar')
        caminho_titulo_eleitoral_auxiliar = salvar_arquivo('titulo_eleitoral_auxiliar')
        caminho_certidao_eleitoral_auxiliar = salvar_arquivo('certidao_eleitoral_auxiliar')
        caminho_antecedentes_criminais_auxiliar = salvar_arquivo('antecedentes_criminais_auxiliar')
        caminho_comprovante_endereco_auxiliar = salvar_arquivo('comprovante_endereco_auxiliar')
        caminho_certificado_curso_auxiliar = salvar_arquivo('certificado_curso_auxiliar')
        caminho_cadastro_cnis_auxiliar = salvar_arquivo('cadastro_cnis_auxiliar')
        caminho_regularidade_cnis_auxiliar = salvar_arquivo('regularidade_cnis_auxiliar')
        caminho_foto_auxiliar = salvar_arquivo('foto_auxiliar')
        caminho_fator_rh_auxiliar = salvar_arquivo('fator_rh_auxiliar')
        
        # Validar documentos obrigatórios do auxiliar (mesma documentação exigida)
        if not (caminho_cnh_auxiliar and caminho_crlv_auxiliar and caminho_certidao_eleitoral_auxiliar and caminho_antecedentes_criminais_auxiliar and caminho_comprovante_endereco_auxiliar and caminho_certificado_curso_auxiliar and caminho_regularidade_cnis_auxiliar and caminho_foto_auxiliar):
            return jsonify({"erro": "Algum documento obrigatório do condutor auxiliar não foi enviado (incluindo a Foto 3/4)."}), 400
            
        if tipo_servico == 'Inclusão de Permissionário':
            if not (caminho_titulo_eleitoral_auxiliar and caminho_cadastro_cnis_auxiliar):
                return jsonify({"erro": "Para inclusão de permissionário, os documentos adicionais do condutor auxiliar são obrigatórios."}), 400

    # Cria protocolo
    novo_protocolo = Protocolo(
        numero_protocolo=numero_protocolo,
        cidadao_id=None,
        tipo_servico=tipo_servico,
        status='Em Análise'
    )
    db.session.add(novo_protocolo)
    db.session.flush()
    
    # Cria a solicitação
    nova_solicitacao = SolicitacaoAlvara(
        protocolo_id=novo_protocolo.id,
        tipo_servico=tipo_servico,
        nome_solicitante=nome,
        cpf=cpf,
        email=email,
        telefone=telefone,
        placa_veiculo=placa_veiculo,
        fator_rh=fator_rh,
        tem_auxiliar=tem_auxiliar,
        nome_auxiliar=nome_auxiliar,
        cpf_auxiliar=cpf_auxiliar,
        
        caminho_cnh=caminho_cnh,
        caminho_crlv=caminho_crlv,
        caminho_titulo_eleitoral=caminho_titulo_eleitoral,
        caminho_certidao_eleitoral=caminho_certidao_eleitoral,
        caminho_antecedentes_criminais=caminho_antecedentes_criminais,
        caminho_comprovante_endereco=caminho_comprovante_endereco,
        caminho_certificado_curso=caminho_certificado_curso,
        caminho_cadastro_cnis=caminho_cadastro_cnis,
        caminho_regularidade_cnis=caminho_regularidade_cnis,
        caminho_foto=caminho_foto,
        caminho_fator_rh=caminho_fator_rh,
        
        caminho_cnh_auxiliar=caminho_cnh_auxiliar,
        caminho_crlv_auxiliar=caminho_crlv_auxiliar,
        caminho_titulo_eleitoral_auxiliar=caminho_titulo_eleitoral_auxiliar,
        caminho_certidao_eleitoral_auxiliar=caminho_certidao_eleitoral_auxiliar,
        caminho_antecedentes_criminais_auxiliar=caminho_antecedentes_criminais_auxiliar,
        caminho_comprovante_endereco_auxiliar=caminho_comprovante_endereco_auxiliar,
        caminho_certificado_curso_auxiliar=caminho_certificado_curso_auxiliar,
        caminho_cadastro_cnis_auxiliar=caminho_cadastro_cnis_auxiliar,
        caminho_regularidade_cnis_auxiliar=caminho_regularidade_cnis_auxiliar,
        caminho_foto_auxiliar=caminho_foto_auxiliar,
        caminho_fator_rh_auxiliar=caminho_fator_rh_auxiliar
    )
    
    db.session.add(nova_solicitacao)
    db.session.commit()
    
    return jsonify({
        "mensagem": "Solicitação enviada com sucesso!",
        "protocolo": numero_protocolo
    }), 201