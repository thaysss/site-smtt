import unittest
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.extensions import db
from app.models.servicos import MensagemOuvidoria, Protocolo


class TestOuvidoria(unittest.TestCase):
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'JWT_SECRET_KEY': 'test-secret-key-at-least-thirty-two-characters',
        })
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        self.client = self.app.test_client()
        self.token = create_access_token(
            identity='admin-ouvidoria',
            additional_claims={'cargo': 'administrador'},
        )
        self.headers = {'Authorization': f'Bearer {self.token}'}

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    @patch('app.routes.public.enviar_protocolo', return_value=True)
    def test_fluxo_completo_da_ouvidoria(self, enviar_email):
        resposta = self.client.post('/api/public/ouvidoria', json={
            'nome': 'Maria da Silva',
            'email': 'MARIA@example.com',
            'assunto': 'Sugestão',
            'mensagem': 'Criar uma nova faixa de pedestres.',
        })

        self.assertEqual(resposta.status_code, 201)
        protocolo_numero = resposta.get_json()['protocolo']
        self.assertTrue(protocolo_numero.startswith('OUV'))
        enviar_email.assert_called_once()

        registro = MensagemOuvidoria.query.one()
        self.assertEqual(registro.email, 'maria@example.com')
        self.assertEqual(registro.protocolo.status, 'Recebida')

        listagem = self.client.get('/api/admin/ouvidoria', headers=self.headers)
        self.assertEqual(listagem.status_code, 200)
        self.assertEqual(listagem.get_json()[0]['numero_protocolo'], protocolo_numero)

        atualizacao = self.client.put(
            f'/api/admin/ouvidoria/{registro.id}',
            headers=self.headers,
            json={'status': 'Respondida', 'resposta': 'A sugestão foi encaminhada ao setor técnico.'},
        )
        self.assertEqual(atualizacao.status_code, 200)
        self.assertEqual(atualizacao.get_json()['registro']['status'], 'Respondida')
        self.assertIsNotNone(atualizacao.get_json()['registro']['respondido_em'])

        consulta = self.client.get(f'/api/public/protocolos/{protocolo_numero}')
        self.assertEqual(consulta.status_code, 200)
        self.assertEqual(consulta.get_json()['tipo_servico'], 'Ouvidoria')
        self.assertEqual(consulta.get_json()['status_julgamento'], 'Respondida')
        self.assertIn('encaminhada', consulta.get_json()['parecer_jari'])

    def test_valida_dados_e_autorizacao(self):
        invalida = self.client.post('/api/public/ouvidoria', json={
            'nome': 'Maria', 'email': 'email-invalido', 'assunto': 'Outro', 'mensagem': 'Teste',
        })
        self.assertEqual(invalida.status_code, 400)
        self.assertEqual(MensagemOuvidoria.query.count(), 0)
        self.assertEqual(Protocolo.query.count(), 0)

        sem_token = self.client.get('/api/admin/ouvidoria')
        self.assertEqual(sem_token.status_code, 401)


if __name__ == '__main__':
    unittest.main()
