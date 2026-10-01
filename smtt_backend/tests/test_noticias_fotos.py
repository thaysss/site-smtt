import io
import json
import unittest
from unittest.mock import patch
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db
from app.models.portal import Noticia


def foto(nome='foto.jpg', conteudo=b'\xff\xd8\xffimagem'):
    return io.BytesIO(conteudo), nome


class TestNoticiasFotos(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        self.client = self.app.test_client()
        token = create_access_token(identity='admin-123', additional_claims={'role': 'admin'})
        self.headers = {'Authorization': f'Bearer {token}'}

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def noticia(self):
        n = Noticia(titulo='Notícia', conteudo='Texto', imagem_url='/capa.jpg', imagens_urls=['/a.jpg', '/b.jpg'])
        db.session.add(n)
        db.session.commit()
        return n.id

    @patch('app.routes.admin.save_upload', side_effect=['/capa.jpg', '/a.jpg', '/b.jpg'])
    def test_criar_e_consultar_galeria(self, salvar):
        r = self.client.post('/api/admin/noticias', headers=self.headers, data={
            'titulo': 'Teste', 'conteudo': 'Texto', 'imagem': foto(), 'imagens': [foto('a.jpg'), foto('b.jpg')]})
        self.assertEqual(r.status_code, 201)
        n = r.get_json()['noticia']
        self.assertEqual(n['imagem_url'], '/capa.jpg')
        self.assertEqual(n['imagens_urls'], ['/a.jpg', '/b.jpg'])
        publico = self.client.get(f"/api/public/noticias/{n['id']}")
        self.assertEqual(publico.get_json()['imagens_urls'], ['/a.jpg', '/b.jpg'])

    @patch('app.routes.admin.delete_upload')
    @patch('app.routes.admin.save_upload', return_value='/nova.jpg')
    def test_editar_mantendo_removendo_e_adicionando(self, salvar, remover):
        id = self.noticia()
        r = self.client.put(f'/api/admin/noticias/{id}', headers=self.headers, data={
            'imagens_mantidas': json.dumps(['/b.jpg']), 'imagens': foto()})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json()['noticia']['imagens_urls'], ['/b.jpg', '/nova.jpg'])
        self.assertEqual(r.get_json()['noticia']['imagem_url'], '/capa.jpg')
        remover.assert_called_once_with('/a.jpg')
        r = self.client.put(f'/api/admin/noticias/{id}', headers=self.headers, data={'titulo': 'Atualizada'})
        self.assertEqual(r.get_json()['noticia']['imagens_urls'], ['/b.jpg', '/nova.jpg'])

    @patch('app.routes.admin.save_upload')
    def test_rejeitar_fotos_invalidas_limite_e_urls_alheias(self, salvar):
        r = self.client.post('/api/admin/noticias', headers=self.headers, data={
            'titulo': 'Teste', 'conteudo': 'Texto', 'imagens': [foto(), foto('ruim.jpg', b'invalido')]})
        self.assertEqual(r.status_code, 400)
        r = self.client.post('/api/admin/noticias', headers=self.headers, data={
            'titulo': 'Teste', 'conteudo': 'Texto', 'imagens': [foto() for _ in range(10)]})
        self.assertEqual(r.status_code, 400)
        id = self.noticia()
        for valor in ['["/outra.jpg"]', '[{}]', 'invalid', '["/a.jpg", "/a.jpg"]']:
            r = self.client.put(f'/api/admin/noticias/{id}', headers=self.headers, data={'imagens_mantidas': valor})
            self.assertEqual(r.status_code, 400)
        salvar.assert_not_called()

    @patch('app.routes.admin.delete_upload')
    @patch('app.routes.admin.save_upload', side_effect=['/nova.jpg', RuntimeError('Falha de armazenamento')])
    def test_falha_upload_preserva_imagens_anteriores(self, salvar, remover):
        id = self.noticia()
        r = self.client.put(f'/api/admin/noticias/{id}', headers=self.headers, data={
            'imagem': foto(), 'imagens': foto()})
        self.assertEqual(r.status_code, 500)
        n = db.session.get(Noticia, id)
        self.assertEqual(n.imagem_url, '/capa.jpg')
        self.assertEqual(n.imagens_urls, ['/a.jpg', '/b.jpg'])
        remover.assert_called_once_with('/nova.jpg')

    @patch('app.routes.admin.delete_upload')
    def test_excluir_remove_todas_as_fotos(self, remover):
        id = self.noticia()
        r = self.client.delete(f'/api/admin/noticias/{id}', headers=self.headers)
        self.assertEqual(r.status_code, 200)
        self.assertEqual({c.args[0] for c in remover.call_args_list}, {'/capa.jpg', '/a.jpg', '/b.jpg'})
        self.assertIsNone(db.session.get(Noticia, id))
