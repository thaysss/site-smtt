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
from app.models.servicos import Protocolo, RecursoMulta, AutoInfracao, SolicitacaoEvento, SolicitacaoAlvara
from flask import request
from app.extensions import db
import os
import random
from datetime import datetime
import uuid
from app.utils.timezone import get_brasilia_time
from app.utils.uploads import save_upload
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}


def validar_limites_campos(campos):
    for nome, valor, limite in campos:
        if valor is not None and len(str(valor)) > limite:
            return jsonify({"erro": f"O campo {nome} deve ter no máximo {limite} caracteres."}), 400
    return None


def allowed_file(arquivo):
    if not arquivo or not arquivo.filename or '.' not in arquivo.filename:
        return False
    extensao = arquivo.filename.rsplit('.', 1)[1].lower()
    if extensao not in ALLOWED_EXTENSIONS:
        return False
    cabecalho = arquivo.stream.read(12)
    arquivo.stream.seek(0)
    assinaturas_validas = (
        extensao == 'pdf' and cabecalho.startswith(b'%PDF-')
    ) or (
        extensao == 'png' and cabecalho.startswith(b'\x89PNG\r\n\x1a\n')
    ) or (
        extensao in {'jpg', 'jpeg'} and cabecalho.startswith(b'\xff\xd8\xff')
    )
    if not assinaturas_validas:
        return False
    arquivo.stream.seek(0, os.SEEK_END)
    tamanho = arquivo.stream.tell()
    arquivo.stream.seek(0)
    return 0 < tamanho <= 10 * 1024 * 1024

@public_bp.route('/protocolos/<numero>', methods=['GET'])
def consultar_protocolo(numero):
    erro_limite = validar_limites_campos([("número do protocolo", numero, 20)])
    if erro_limite:
        return erro_limite

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
            "parecer_jari": evento.resposta_analise if evento else "Sua solicitação de evento está em análise pela equipe técnica da SMTT.",
            "anexo_resposta_evento": evento.anexo_resposta if evento else None
        }), 200
    elif protocolo.tipo_servico in ['Renovação de Alvará', 'Inclusão de Permissionário']:
        alvara = SolicitacaoAlvara.query.filter_by(protocolo_id=protocolo.id).first()
        return jsonify({
            "numero_protocolo": protocolo.numero_protocolo,
            "data_abertura": protocolo.criado_em.strftime("%d/%m/%Y"),
            "tipo_servico": protocolo.tipo_servico,
            "status_julgamento": protocolo.status,
            "parecer_jari": alvara.resposta_analise if alvara else "Sua solicitação de alvará/permissionário está em análise pela equipe técnica da SMTT.",
            "caminho_alvara_emitido": alvara.caminho_alvara_emitido if alvara else None
        }), 200
    else:
        recurso = RecursoMulta.query.filter_by(protocolo_id=protocolo.id).first()

        # Retorna o status do julgamento para a tela do cidadão
        return jsonify({
            "numero_protocolo": protocolo.numero_protocolo,
            "data_abertura": protocolo.criado_em.strftime("%d/%m/%Y"),
            "tipo_servico": protocolo.tipo_servico,
            "status_julgamento": recurso.resultado_julgamento if recurso else protocolo.status,
            "parecer_jari": recurso.justificativa_julgamento if recurso else "Sua defesa está em análise pela equipe técnica.",
            "anexo_resposta_jari": recurso.anexo_resposta_jari if recurso else None
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

    if not (nome and cpf_cnpj and email and telefone and data_evento):
        return jsonify({"erro": "Todos os campos obrigatórios devem ser preenchidos."}), 400

    erro_limite = validar_limites_campos([
        ("nome", nome, 150),
        ("CPF/CNPJ", cpf_cnpj, 14),
        ("e-mail", email, 100),
        ("telefone", telefone, 20),
        ("data do evento", data_evento, 50),
        ("local do evento", local_evento, 255),
        ("descrição", descricao, 2000),
    ])
    if erro_limite:
        return erro_limite

    arquivo = request.files.get('arquivo')
    if not arquivo or arquivo.filename == '':
        return jsonify({"erro": "O formulário de requerimento assinado é obrigatório."}), 400

    if not allowed_file(arquivo):
        return jsonify({"erro": "Tipo de arquivo não permitido. Apenas arquivos PDF, PNG, JPG e JPEG são suportados."}), 400

    # Gera um número de protocolo único (Ex: EVE202606114819)
    numero_protocolo = f"EVE{get_brasilia_time().strftime('%Y%m%d')}{random.randint(1000,9999)}"

    # Salva o arquivo enviado

    ext = arquivo.filename.rsplit('.', 1)[1].lower() if '.' in arquivo.filename else 'pdf'
    nome_seguro = secure_filename(f"evento_{numero_protocolo}_{uuid.uuid4().hex}.{ext}")
    caminho_salvo = save_upload(arquivo, f"eventos/{nome_seguro}")

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
    dados = request.get_json(silent=True) or {}
    placa = str(dados.get('placa', '')).upper().replace('-', '').replace(' ', '').strip()

    erro_limite = validar_limites_campos([("placa", placa, 7)])
    if erro_limite:
        return erro_limite

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

    erro_limite = validar_limites_campos([
        ("tipo de serviço", tipo_servico, 100),
        ("nome", nome, 150),
        ("CPF", cpf, 11),
        ("e-mail", email, 100),
        ("telefone", telefone, 20),
        ("placa do veículo", placa_veiculo, 7),
        ("fator RH", fator_rh, 10),
        ("nome do auxiliar", nome_auxiliar, 150),
        ("CPF do auxiliar", cpf_auxiliar, 11),
    ])
    if erro_limite:
        return erro_limite

    # Gera um número de protocolo único
    prefixo = "ALV" if tipo_servico == 'Renovação de Alvará' else "PER"
    numero_protocolo = f"{prefixo}{get_brasilia_time().strftime('%Y%m%d')}{random.randint(1000,9999)}"

    # Salvar arquivos

    def salvar_arquivo(campo_nome):
        arq = request.files.get(campo_nome)
        if arq and arq.filename != '':
            if not allowed_file(arq):
                raise ValueError(f"O arquivo enviado no campo '{campo_nome}' possui uma extensão não permitida. Apenas arquivos PDF, PNG, JPG e JPEG são permitidos.")
            ext = arq.filename.rsplit('.', 1)[1].lower() if '.' in arq.filename else 'pdf'
            nome_seguro = secure_filename(f"{numero_protocolo}_{campo_nome}_{uuid.uuid4().hex}.{ext}")
            return save_upload(arq, f"alvaras/{nome_seguro}")
        return None

    try:
        # Salva arquivos do permissionário
        caminho_requerimento = salvar_arquivo('requerimento')
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
        if not (caminho_requerimento and caminho_cnh and caminho_crlv and caminho_certidao_eleitoral and caminho_antecedentes_criminais and caminho_comprovante_endereco and caminho_certificado_curso and caminho_regularidade_cnis and caminho_foto):
            return jsonify({"erro": "Algum documento obrigatório do permissionário não foi enviado (incluindo o Requerimento Preenchido e a Foto 3/4)."}), 400

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
    except ValueError as ve:
        return jsonify({"erro": str(ve)}), 400

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

        caminho_requerimento=caminho_requerimento,
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


@public_bp.route('/recurso-multa', methods=['POST'])
def enviar_recurso_multa_publico():
    placa = request.form.get('placa', '').upper().replace('-', '').replace(' ', '').strip()
    numero_ait = request.form.get('numero_ait', '').upper().strip()
    tipo_recurso = request.form.get('tipo_recurso', 'Defesa Prévia')
    nome_solicitante = request.form.get('nome_solicitante')
    cpf_solicitante = request.form.get('cpf_solicitante')
    email_solicitante = request.form.get('email_solicitante')
    telefone_solicitante = request.form.get('telefone_solicitante')

    if not (placa and numero_ait and nome_solicitante and cpf_solicitante and email_solicitante and telefone_solicitante):
        return jsonify({"erro": "Todos os campos obrigatórios devem ser preenchidos."}), 400

    erro_limite = validar_limites_campos([
        ("placa", placa, 7),
        ("número do AIT", numero_ait, 20),
        ("tipo de recurso", tipo_recurso, 50),
        ("nome do requerente", nome_solicitante, 150),
        ("CPF do requerente", cpf_solicitante, 11),
        ("e-mail", email_solicitante, 100),
        ("telefone", telefone_solicitante, 20),
    ])
    if erro_limite:
        return erro_limite

    if len(placa) != 7:
        return jsonify({"erro": "A placa do veículo deve conter exatamente 7 caracteres (letras e números)."}), 400

    # Lógica para os arquivos obrigatórios e opcionais
    requerimento_arq = request.files.get('requerimento')
    if not requerimento_arq or requerimento_arq.filename == '':
        return jsonify({"erro": "O Formulário de Requerimento Único preenchido é obrigatório."}), 400

    documento_identificacao_arq = request.files.get('documento_identificacao')
    if not documento_identificacao_arq or documento_identificacao_arq.filename == '':
        return jsonify({"erro": "O Documento de Identificação (CNH ou RG) é obrigatório."}), 400

    crlv_arq = request.files.get('crlv')
    if not crlv_arq or crlv_arq.filename == '':
        return jsonify({"erro": "O CRLV do veículo é obrigatório."}), 400

    notificacao_arq = request.files.get('notificacao')
    if not notificacao_arq or notificacao_arq.filename == '':
        return jsonify({"erro": "A Cópia da Notificação de Autuação é obrigatória."}), 400

    selfie_documento_arq = request.files.get('selfie_documento')
    if not selfie_documento_arq or selfie_documento_arq.filename == '':
        return jsonify({"erro": "A Foto segurando o documento oficial ao lado do rosto é obrigatória."}), 400

    # 1. Encontra ou cria o Veículo
    veiculo = Veiculo.query.filter_by(placa=placa).first()
    if not veiculo:
        veiculo = Veiculo(placa=placa)
        db.session.add(veiculo)
        db.session.flush() # Para gerar o id do veículo

    # 2. Encontra ou cria o Auto de Infração (AIT)
    infracao = AutoInfracao.query.filter_by(numero_ait=numero_ait).first()
    if not infracao:
        infracao = AutoInfracao(
            numero_ait=numero_ait,
            veiculo_id=veiculo.id,
            data_hora_infracao=get_brasilia_time(),
            local_cometimento="Não especificado (Registro via Formulário Público)",
            fase_atual=f"Em Análise ({tipo_recurso})",
            valor_final=0.00
        )
        db.session.add(infracao)
        db.session.flush() # Para gerar o id da infração
    else:
        # Se a infração existe mas está vinculada a outro carro, avisar
        if infracao.veiculo_id != veiculo.id:
            return jsonify({"erro": f"O Auto de Infração {numero_ait} está registrado para outra placa."}), 400
        infracao.fase_atual = f"Em Análise ({tipo_recurso})"

    # Gera um número de protocolo único
    numero_protocolo = f"CON{get_brasilia_time().strftime('%Y%m%d')}{random.randint(1000,9999)}"

    # Salva arquivos

    def salvar_arquivo_publico(arq, tipo_nome):
        if arq and arq.filename != '':
            if not allowed_file(arq):
                raise ValueError(f"O arquivo enviado no campo '{tipo_nome}' possui uma extensão não permitida. Apenas arquivos PDF, PNG, JPG e JPEG são permitidos.")
            ext = arq.filename.rsplit('.', 1)[1].lower() if '.' in arq.filename else 'pdf'
            nome_seguro = secure_filename(f"{numero_protocolo}_{tipo_nome}_{uuid.uuid4().hex}.{ext}")
            return save_upload(arq, f"cidadao/{nome_seguro}")
        return None

    try:
        # Salva o arquivo principal (Requerimento)
        caminho_requerimento = salvar_arquivo_publico(requerimento_arq, 'requerimento')

        # Cria o protocolo geral
        novo_protocolo = Protocolo(
            numero_protocolo=numero_protocolo,
            cidadao_id=None,
            tipo_servico=f"Recurso - {tipo_recurso}",
            status='Em Análise'
        )
        db.session.add(novo_protocolo)
        db.session.flush()

        # Cria o recurso de multa
        novo_recurso = RecursoMulta(
            auto_infracao_id=infracao.id,
            protocolo_id=novo_protocolo.id,
            tipo_recurso=tipo_recurso,
            resultado_julgamento='Em Análise',
            arquivo_recurso_cidadao=caminho_requerimento
        )
        db.session.add(novo_recurso)
        db.session.flush()

        # Salva os demais documentos na tabela RecursoAnexo
        anexos_a_salvar = [
            (documento_identificacao_arq, 'documento_identificacao'),
            (crlv_arq, 'crlv'),
            (notificacao_arq, 'notificacao'),
            (selfie_documento_arq, 'selfie_documento')
        ]

        # Também suporta outros anexos opcionais
        outros_anexos = request.files.getlist('outros_anexos')
        for idx, arq in enumerate(outros_anexos):
            if arq and arq.filename != '':
                anexos_a_salvar.append((arq, f"outros_{idx}"))

        from app.models.servicos import RecursoAnexo
        for arq, tipo_nome in anexos_a_salvar:
            caminho = salvar_arquivo_publico(arq, tipo_nome)
            if caminho:
                novo_anexo = RecursoAnexo(
                    recurso_id=novo_recurso.id,
                    caminho_arquivo=caminho,
                    nome_original=arq.filename
                )
                db.session.add(novo_anexo)

        db.session.commit()
    except ValueError as ve:
        return jsonify({"erro": str(ve)}), 400

    return jsonify({
        "mensagem": "Contestação de multa enviada com sucesso!",
        "protocolo": numero_protocolo
    }), 201
