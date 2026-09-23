from unittest.mock import patch

from app import create_app
from app.extensions import db
from app.models.cidadao import Cidadao


def criar_cliente():
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'MAIL_SUPPRESS_SEND': True,
    })
    with app.app_context():
        db.create_all()
    return app, app.test_client()


def test_cadastro_exige_codigo_enviado_por_email():
    app, client = criar_cliente()
    dados = {'nome': 'Maria Silva', 'cpf': '12345678901', 'email': 'maria@example.com',
             'telefone': '79999999999', 'endereco': 'Rua Central, 10', 'senha': 'senha-segura'}
    with patch('app.routes.auth.secrets.randbelow', return_value=123456), \
         patch('app.routes.auth.enviar_codigo_verificacao', return_value=True) as enviar:
        resposta = client.post('/api/auth/cadastro', json=dados)
        assert resposta.status_code == 202
        enviar.assert_called_once_with('maria@example.com', 'Maria Silva', '123456', 'cadastro')

    with app.app_context():
        assert Cidadao.query.count() == 0

    invalido = client.post('/api/auth/cadastro/confirmar', json={'cpf': dados['cpf'], 'codigo': '000000'})
    assert invalido.status_code == 400
    confirmado = client.post('/api/auth/cadastro/confirmar', json={'cpf': dados['cpf'], 'codigo': '123456'})
    assert confirmado.status_code == 201
    with app.app_context():
        assert Cidadao.query.filter_by(email='maria@example.com').one().verificar_senha('senha-segura')


def test_recuperacao_redefine_senha_com_codigo():
    app, client = criar_cliente()
    with app.app_context():
        usuario = Cidadao(nome_completo='Joao Souza', cpf='10987654321', email='joao@example.com')
        usuario.set_senha('senha-antiga')
        db.session.add(usuario)
        db.session.commit()

    with patch('app.routes.auth.secrets.randbelow', return_value=654321), \
         patch('app.routes.auth.enviar_codigo_verificacao', return_value=True) as enviar:
        resposta = client.post('/api/auth/senha/esqueci', json={'cpf': '10987654321', 'email': 'joao@example.com'})
        assert resposta.status_code == 200
        enviar.assert_called_once_with('joao@example.com', 'Joao Souza', '654321', 'recuperacao')

    redefinida = client.post('/api/auth/senha/redefinir', json={
        'cpf': '10987654321', 'email': 'joao@example.com', 'codigo': '654321', 'nova_senha': 'senha-nova-segura'
    })
    assert redefinida.status_code == 200
    login = client.post('/api/auth/login', json={'cpf': '10987654321', 'senha': 'senha-nova-segura'})
    assert login.status_code == 200


def test_recuperacao_nao_revela_conta_inexistente():
    _, client = criar_cliente()
    resposta = client.post('/api/auth/senha/esqueci', json={'cpf': '00000000000', 'email': 'ninguem@example.com'})
    assert resposta.status_code == 200
    assert 'Se os dados estiverem cadastrados' in resposta.get_json()['mensagem']
