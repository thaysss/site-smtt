import unittest
from datetime import datetime
from flask_jwt_extended import create_access_token
from sqlalchemy import event
from app import create_app
from app.extensions import db
from app.models.portal import Noticia
from app.models.servicos import Protocolo, SolicitacaoEvento


class TestLoadingPerformance(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        self.client = self.app.test_client()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def test_news_paging_filters_and_detail(self):
        for i in range(8):
            db.session.add(Noticia(titulo=f'News {i}', conteudo='Long text',
                                  categoria='Geral' if i % 2 == 0 else 'Outro', criado_em=datetime(2026, 1, 1)))
        db.session.commit()
        first = self.client.get('/api/public/noticias?pagina=1&limite=3').get_json()
        second = self.client.get('/api/public/noticias?pagina=2&limite=3').get_json()
        self.assertEqual(first['total'], 8)
        self.assertEqual([n['titulo'] for n in first['itens']], ['News 7', 'News 6', 'News 5'])
        self.assertTrue(set(n['id'] for n in first['itens']).isdisjoint(n['id'] for n in second['itens']))
        self.assertNotIn('conteudo', first['itens'][0])
        detail = self.client.get(f"/api/public/noticias/{first['itens'][0]['id']}").get_json()
        self.assertEqual(detail['conteudo'], 'Long text')
        filtered = self.client.get('/api/public/noticias?pagina=1&categoria=Geral&q=News').get_json()
        self.assertEqual(filtered['total'], 4)
        self.assertTrue(all(n['categoria'] == 'Geral' for n in filtered['itens']))
        self.assertEqual(self.client.get('/api/public/noticias?pagina=1&q=%25').get_json()['total'], 0)
        self.assertIsInstance(self.client.get('/api/public/noticias').get_json(), list)

    def test_invalid_paging(self):
        for query in ['pagina=0', 'pagina=x', 'limite=-1', 'limite=101']:
            self.assertEqual(self.client.get('/api/public/noticias?' + query).status_code, 400)

    def test_event_listing_uses_one_query_for_twelve_records(self):
        for i in range(12):
            protocol = Protocolo(numero_protocolo=f'EVT-{i}', tipo_servico='Evento')
            db.session.add(protocol)
            db.session.flush()
            db.session.add(SolicitacaoEvento(protocolo_id=protocol.id, nome_solicitante='Name',
                           cpf_cnpj='123', email='test@example.com', telefone='123',
                           data_evento='2026-11-01', caminho_arquivo='/test.pdf'))
        db.session.commit()
        db.session.remove()
        token = create_access_token(identity='admin', additional_claims={'role': 'admin'})
        queries = []

        def capture(conn, cursor, statement, parameters, context, executemany):
            if statement.lstrip().upper().startswith('SELECT'):
                queries.append(statement)

        event.listen(db.engine, 'before_cursor_execute', capture)
        try:
            response = self.client.get('/api/admin/eventos', headers={'Authorization': f'Bearer {token}'})
        finally:
            event.remove(db.engine, 'before_cursor_execute', capture)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.get_json()), 12)
        self.assertEqual(len(queries), 1)
