import logging
import smtplib
import ssl
from email.message import EmailMessage

from flask import current_app

logger = logging.getLogger(__name__)


def enviar_email(destinatario, assunto, texto):
    if current_app.config.get('MAIL_SUPPRESS_SEND'):
        logger.info('E-mail suprimido para %s: %s', destinatario, assunto)
        return True
    host = current_app.config.get('MAIL_SERVER')
    usuario = current_app.config.get('MAIL_USERNAME')
    senha = current_app.config.get('MAIL_PASSWORD')
    remetente = current_app.config.get('MAIL_DEFAULT_SENDER') or usuario
    if not host or not remetente:
        logger.error('SMTP nao configurado; e-mail para %s nao enviado.', destinatario)
        return False
    mensagem = EmailMessage()
    mensagem['Subject'] = assunto
    mensagem['From'] = remetente
    mensagem['To'] = destinatario
    mensagem.set_content(texto)
    try:
        timeout = current_app.config.get('MAIL_TIMEOUT', 10)
        if current_app.config.get('MAIL_USE_SSL'):
            with smtplib.SMTP_SSL(host, current_app.config['MAIL_PORT'], timeout=timeout, context=ssl.create_default_context()) as smtp:
                if usuario:
                    smtp.login(usuario, senha)
                smtp.send_message(mensagem)
        else:
            with smtplib.SMTP(host, current_app.config['MAIL_PORT'], timeout=timeout) as smtp:
                if current_app.config.get('MAIL_USE_TLS'):
                    smtp.starttls(context=ssl.create_default_context())
                if usuario:
                    smtp.login(usuario, senha)
                smtp.send_message(mensagem)
        return True
    except (OSError, smtplib.SMTPException):
        logger.exception('Falha ao enviar e-mail para %s.', destinatario)
        return False


def enviar_codigo_verificacao(destinatario, nome, codigo, finalidade):
    acao = 'confirmar a criacao da sua conta' if finalidade == 'cadastro' else 'redefinir sua senha'
    return enviar_email(destinatario, 'Codigo de verificacao - Portal SMTT Propria', f'Ola, {nome}.\n\nSeu codigo para {acao} e: {codigo}\n\nO codigo expira em 10 minutos. Se voce nao solicitou esta acao, ignore esta mensagem.\n\nSMTT Propria')


def enviar_protocolo(destinatario, nome, numero, tipo_servico):
    return enviar_email(destinatario, f'Protocolo {numero} criado - SMTT Propria', f'Ola, {nome}.\n\nSua solicitacao foi recebida com sucesso.\nProtocolo: {numero}\nServico: {tipo_servico}\nStatus inicial: Em Analise\n\nGuarde este numero para acompanhar o andamento no Portal SMTT Propria.')
