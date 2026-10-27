"""Histórico administrativo gravado na mesma transação da alteração."""
from flask import has_request_context, request
from flask_jwt_extended import get_jwt
from sqlalchemy import event, inspect, select
from app.models.atividade import AtividadeUsuario
from app.models.servidor import Servidor
from app.models.servicos import (
    AutoInfracao, SolicitacaoEvento, SolicitacaoAlvara, RecursoMulta,
    MensagemOuvidoria, Veiculo, Protocolo,
)
from app.models.portal import AlertaTransito, Noticia
from app.utils.cargos import cargo_das_claims

MODELOS = {
    AutoInfracao: ('infracoes', 'Infração'),
    SolicitacaoEvento: ('eventos', 'Solicitação de evento'),
    SolicitacaoAlvara: ('alvaras', 'Solicitação de alvará'),
    RecursoMulta: ('recursos', 'Recurso'),
    MensagemOuvidoria: ('ouvidoria', 'Atendimento da ouvidoria'),
    Veiculo: ('veiculos', 'Veículo'),
    AlertaTransito: ('alertas', 'Alerta'),
    Noticia: ('noticias', 'Notícia'),
    Protocolo: ('protocolos', 'Protocolo'),
}


def _registrar(mapper, connection, alvo, operacao):
    if not has_request_context() or not request.path.startswith('/api/admin/'):
        return
    claims = get_jwt()
    perfil = cargo_das_claims(claims)
    if not perfil:
        return
    try:
        usuario_id = int(claims['sub'])
    except (ValueError, TypeError, KeyError):
        return
    nome = connection.execute(select(Servidor.nome).where(Servidor.id == usuario_id)).scalar_one_or_none()
    if nome is None:
        return
    campos = sorted(attr.key for attr in inspect(alvo).mapper.column_attrs
                    if inspect(alvo).attrs[attr.key].history.has_changes())
    if operacao == 'Atualização' and not campos:
        return
    entidade, rotulo = MODELOS[type(alvo)]
    registro_id = alvo.id
    if isinstance(alvo, Protocolo):
        if operacao != 'Atualização' or 'status' not in campos:
            return
        for modelo in (SolicitacaoEvento, SolicitacaoAlvara, RecursoMulta, MensagemOuvidoria):
            vinculado = connection.execute(select(modelo.id).where(modelo.protocolo_id == alvo.id)).scalar()
            if vinculado is not None:
                entidade, rotulo = MODELOS[modelo]
                registro_id = vinculado
                break
        else:
            return
    acao = operacao
    if operacao == 'Criação' and entidade == 'infracoes':
        acao = 'Infração lançada'
    elif operacao == 'Atualização' and request.path.endswith('/julgar'):
        acao = 'Decisão registrada'
    elif operacao == 'Atualização' and 'resposta' in campos:
        acao = 'Resposta registrada'
    referencia = getattr(alvo, 'numero_ait', None)
    if isinstance(alvo, Protocolo):
        referencia = alvo.numero_protocolo
        acao = 'Status atualizado: ' + alvo.status
    protocolo_id = getattr(alvo, 'protocolo_id', None)
    if protocolo_id:
        referencia = connection.execute(select(Protocolo.numero_protocolo).where(Protocolo.id == protocolo_id)).scalar()
    detalhes = f'{rotulo} {referencia or "#" + str(alvo.id)}.'
    if operacao == 'Atualização':
        detalhes += ' Campos alterados: ' + ', '.join(campos) + '.'
    # Apenas identificação e nomes dos campos; nunca copiar dados pessoais ou o corpo da requisição.
    connection.execute(AtividadeUsuario.__table__.insert().values(
        usuario_id=str(usuario_id), usuario_nome=nome, perfil=perfil,
        metodo=request.method, recurso=request.path[:255], status=200,
        entidade=entidade, entidade_id=registro_id, acao=acao, detalhes=detalhes,
    ))


def _criar(mapper, connection, alvo):
    _registrar(mapper, connection, alvo, 'Criação')


def _atualizar(mapper, connection, alvo):
    _registrar(mapper, connection, alvo, 'Atualização')


def _excluir(mapper, connection, alvo):
    _registrar(mapper, connection, alvo, 'Exclusão')


def instalar_historico():
    for modelo in MODELOS:
        for evento, funcao in [('after_insert', _criar), ('after_update', _atualizar), ('after_delete', _excluir)]:
            if not event.contains(modelo, evento, funcao):
                event.listen(modelo, evento, funcao)
