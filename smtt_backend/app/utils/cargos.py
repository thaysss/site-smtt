import unicodedata

CARGOS = {
    'administrador': 'Administrador',
    'supervisor': 'Supervisor',
    'analista': 'Analista',
    'agente_transito': 'Agente de Trânsito',
}

FASES_INFRACAO = {
    'Autuação',
    'Defesa em Análise',
    'Defesa Deferida (Cancelada)',
    'Defesa Indeferida',
    'Penalidade',
    'Quitada',
}

PERMISSOES = {
    'administrador': {'*'},
    'supervisor': {'dashboard', 'registros', 'recursos', 'eventos', 'alvaras', 'noticias', 'infracoes', 'veiculos', 'alertas'},
    'analista': {'dashboard', 'registros', 'recursos', 'eventos', 'alvaras', 'noticias'},
    'agente_transito': {'dashboard', 'registros', 'infracoes', 'veiculos', 'alertas'},
}

RECURSOS_REGISTROS = {
    'administrador': {'eventos', 'alvaras', 'recursos', 'infracoes', 'veiculos', 'alertas', 'noticias', 'protocolos'},
    'supervisor': {'eventos', 'alvaras', 'recursos', 'infracoes', 'veiculos', 'alertas', 'noticias', 'protocolos'},
    'analista': {'eventos', 'alvaras', 'recursos', 'noticias', 'protocolos'},
    'agente_transito': {'infracoes', 'veiculos', 'alertas'},
}

def _chave(valor):
    texto = unicodedata.normalize('NFKD', str(valor or '').strip().lower())
    texto = ''.join(char for char in texto if not unicodedata.combining(char))
    return '_'.join(texto.replace('-', ' ').split())

def normalizar_cargo(valor):
    chave = _chave(valor)
    aliases = {'admin': 'administrador', 'agente': 'agente_transito', 'agente_de_transito': 'agente_transito'}
    chave = aliases.get(chave, chave)
    return (chave, CARGOS[chave]) if chave in CARGOS else (None, None)

def cargo_das_claims(claims):
    cargo = claims.get('cargo') or claims.get('role')
    chave, _ = normalizar_cargo(cargo)
    return chave

def pode_acessar(cargo, recurso):
    permissoes = PERMISSOES.get(cargo, set())
    return '*' in permissoes or recurso in permissoes

def pode_acessar_registro(cargo, recurso):
    return recurso in RECURSOS_REGISTROS.get(cargo, set())
