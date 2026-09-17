# test_query.py
from app import create_app, db
from app.models.servicos import RecursoMulta, RecursoAnexo

app = create_app()

with app.app_context():
    recursos = RecursoMulta.query.all()
    print(f"Total de recursos: {len(recursos)}")
    for r in recursos:
        print(f"Recurso ID: {r.id}, Protocolo: {r.protocolo.numero_protocolo if r.protocolo else 'N/A'}, Principal: {r.arquivo_recurso_cidadao}")
        print(f"  Anexos ({len(r.anexos)}):")
        for a in r.anexos:
            print(f"    - ID: {a.id}, Nome Original: {a.nome_original}, Caminho: {a.caminho_arquivo}")
        
    print("\nTotal de registros na tabela recursos_anexos:")
    anexos = RecursoAnexo.query.all()
    print(f"Total anexos: {len(anexos)}")
    for a in anexos:
        print(f"Anexo ID: {a.id}, Recurso ID: {a.recurso_id}, Nome Original: {a.nome_original}, Caminho: {a.caminho_arquivo}")
