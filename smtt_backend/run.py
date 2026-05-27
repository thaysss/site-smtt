# run.py
from app import create_app

# Cria a instância da aplicação
app = create_app()

if __name__ == '__main__':
    # O host='0.0.0.0' permite que o app seja acessado de outras máquinas na rede da prefeitura
    # A porta padrão do Flask é 5000
    app.run(host='0.0.0.0', port=5000, debug=True)