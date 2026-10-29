from flask import Flask
from app.extensions import db
from app.models.servicos import SolicitacaoEvento
import app.models.cidadao  # Register referenced citizen table.


def test_sync_auth_retry_conflict_and_private_fields():
    from app.routes.eventos_sync import sync_bp
    app = Flask(__name__)
    app.config.update(TESTING=True, SQLALCHEMY_DATABASE_URI='sqlite:///:memory:',
                      EVENTOS_SYNC_TOKEN='x' * 40)
    db.init_app(app)
    app.register_blueprint(sync_bp)
    with app.app_context():
        db.create_all()
        client = app.test_client()
        url = '/api/integracoes/eventos/sincronizar'
        headers = {'Authorization': 'Bearer ' + 'x' * 40}
        row = dict(chave='a62d91e7-927a-4136-a69f-ec2ba11142dd', nome_solicitante='Maria',
                   telefone='123', data_evento='2026-11-10T14:30', local_evento='Praça', descricao='Festa')
        assert client.post(url, json={'eventos': []}).status_code == 401
        for _ in range(2):
            response = client.post(url, json={'eventos': [row]}, headers=headers)
            assert response.status_code == 200
        assert SolicitacaoEvento.query.count() == 1
        event = SolicitacaoEvento.query.one()
        event.local_evento = 'Local do site'
        event.cpf_cnpj = 'privado'
        db.session.commit()
        row['local_evento'] = 'Local da planilha'
        response = client.post(url, json={'eventos': [row]}, headers=headers).get_json()
        assert response['conflitos'][0]['campos'] == ['local_evento']
        assert event.local_evento == 'Local do site'
        assert 'cpf_cnpj' not in response['eventos'][0]
        row['local_evento'] = 'Local do site'
        assert not client.post(url, json={'eventos': [row]}, headers=headers).get_json()['conflitos']
        assert client.post(url, json={'eventos': [row, row]}, headers=headers).status_code == 400
        db.session.remove()
        db.drop_all()
