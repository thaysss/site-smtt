from datetime import datetime, timezone, timedelta

def get_brasilia_time():
    """Retorna a data e hora atual no fuso horário de Brasília (UTC-3), sem informação de timezone (naive)."""
    return datetime.now(timezone(timedelta(hours=-3))).replace(tzinfo=None)
