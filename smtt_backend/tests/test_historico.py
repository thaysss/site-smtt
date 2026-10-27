import unittest
from unittest.mock import patch
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db
from app.models.atividade import AtividadeUsuario
from app.models.servidor import Servidor
from app.models.servicos import AutoInfracao, Protocolo, SolicitacaoEvento


class TestHistorico(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
                               'JWT_SECRET_KEY': 'test-secret-key-at-least-thirty-two-characters'})
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        usuario = Servidor(nome='Maria Gestora', matricula='1', cargo='Supervisor', senha_hash='unused')
        db.session.add(usuario)
        protocolo = Protocolo(numero_protocolo='EVT-HIST', tipo_servico='Solicitação de Evento')
        db.session.add(protocolo)
        db.session.flush()
        evento = SolicitacaoEvento(protocolo_id=protocolo.id, nome_solicitante='Cidadão',
            cpf_cnpj='123', email='cidadao@example.com', telefone='123', data_evento='2026-11-10', caminho_arquivo='/teste.pdf')
        db.session.add(evento)
        db.session.commit()
        self.evento_id = evento.id
        self.usuario_id = usuario.id
        self.headers = self.token('supervisor')
        self.client = self.app.test_client()

    def token(self, cargo=None):
        return {'Authorization': 'Bearer ' + create_access_token(identity=str(self.usuario_id),
            additional_claims={'cargo': cargo} if cargo else {})}

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    @patch('app.routes.admin.enviar_resposta_evento', return_value=True)
    def test_decisao_registra_autor_status_e_respeita_permissoes(self, email):
        resposta = self.client.put(f'/api/admin/eventos/{self.evento_id}/julgar',
            json={'decisao': 'Aprovado', 'justificativa_jari': 'Parecer privado'}, headers=self.headers)
        self.assertEqual(resposta.status_code, 200)
        url = f'/api/auth/admin/historico/eventos/{self.evento_id}'
        historico = self.client.get(url, headers=self.headers)
        self.assertEqual(historico.status_code, 200)
        itens = historico.json['itens']
        self.assertTrue(any(item['acao'] == 'Decisão registrada' for item in itens))
        self.assertTrue(any(item['acao'] == 'Status atualizado: Aprovado' for item in itens))
        self.assertTrue(all(item['usuario_nome'] == 'Maria Gestora' for item in itens))
        self.assertTrue(all('EVT-HIST' in item['detalhes'] for item in itens))
        self.assertNotIn('Parecer privado', str(itens))
        for cargo in (None, 'agente_transito'):
            self.assertEqual(self.client.get(url, headers=self.token(cargo)).status_code, 403)
        self.assertEqual(self.client.get(url).status_code, 401)
        self.assertEqual(self.client.get(url + '?pagina=0', headers=self.headers).status_code, 400)
        self.assertEqual(self.client.get(url + '?pagina=2', headers=self.headers).json['itens'], [])
        self.assertEqual(self.client.get(f'/api/auth/admin/historico/eventos/{self.evento_id + 1}', headers=self.headers).json['itens'], [])

    def test_lancamento_infracao_e_rollback_atomico(self):
        from app.models.servicos import Veiculo
        veiculo = Veiculo(placa='ABC1234')
        db.session.add(veiculo)
        db.session.commit()
        from datetime import datetime
        with self.app.test_request_context('/api/admin/infracoes', method='POST', headers=self.headers):
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request()
            infracao = AutoInfracao(numero_ait='AIT-HIST', veiculo_id=veiculo.id,
                                    data_hora_infracao=datetime.now(), local_cometimento='Centro')
            db.session.add(infracao)
            db.session.flush()
            self.assertEqual(AtividadeUsuario.query.filter_by(acao='Infração lançada').count(), 1)
            db.session.rollback()
            self.assertEqual(AtividadeUsuario.query.count(), 0)
            self.assertEqual(AutoInfracao.query.count(), 0)
            db.session.add(infracao)
            db.session.commit()
        log = AtividadeUsuario.query.one()
        self.assertEqual(log.entidade_id, infracao.id)
        self.assertIn('AIT-HIST', log.detalhes)
        with self.app.test_request_context('/api/admin/infracoes/1', method='DELETE', headers=self.headers):
            verify_jwt_in_request()
            db.session.delete(infracao)
            db.session.commit()
        self.assertEqual(AtividadeUsuario.query.filter_by(entidade='infracoes').count(), 2)

    def test_validacao_rejeitada_nao_salva_parecer_nem_acao(self):
        from io import BytesIO
        parecer_inicial = db.session.get(SolicitacaoEvento, self.evento_id).resposta_analise
        resposta = self.client.put(f'/api/admin/eventos/{self.evento_id}/julgar', headers=self.headers,
            data={'decisao': 'Aprovado', 'justificativa_jari': 'Não deve persistir',
                  'arquivo_resposta': (BytesIO(b'invalido'), 'teste.pdf')})
        self.assertEqual(resposta.status_code, 400)
        self.assertEqual(db.session.get(SolicitacaoEvento, self.evento_id).resposta_analise, parecer_inicial)
        self.assertEqual(AtividadeUsuario.query.filter(AtividadeUsuario.acao.isnot(None)).count(), 0)
        self.assertEqual(AtividadeUsuario.query.one().status, 400)
