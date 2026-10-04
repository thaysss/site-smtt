"""Prepare Lightsail environment from the Railway export without printing secrets."""
from pathlib import Path
from dotenv import dotenv_values

root = Path(__file__).resolve().parent
source = root / 'production.env'
if not source.exists():
    raise SystemExit('Salve as variaveis de producao em aws/lightsail/production.env.')
values = dict(dotenv_values(source, interpolate=False))
required = ['DATABASE_URL', 'SECRET_KEY', 'JWT_SECRET_KEY', 'MAIL_USERNAME', 'MAIL_PASSWORD', 'MAIL_DEFAULT_SENDER']
missing = [key for key in required if not values.get(key)]
if missing:
    raise SystemExit('Variaveis ausentes: ' + ', '.join(missing))
for key in ('SECRET_KEY', 'JWT_SECRET_KEY'):
    if len(values[key]) < 32:
        raise SystemExit(f'{key} deve ter pelo menos 32 caracteres; preserve o valor atual de producao.')
if not values['DATABASE_URL'].startswith(('postgresql://', 'postgresql+psycopg://', 'postgres://')):
    raise SystemExit('DATABASE_URL deve apontar para PostgreSQL no Supabase.')
# This image installs psycopg 3; SQLAlchemy defaults to psycopg2 for plain URLs.
for scheme in ('postgresql://', 'postgres://'):
    if values['DATABASE_URL'].startswith(scheme):
        values['DATABASE_URL'] = 'postgresql+psycopg://' + values['DATABASE_URL'][len(scheme):]
        break
values.update({
    'FLASK_ENV': 'production',
    'CORS_ALLOWED_ORIGINS': 'https://smttpropria.com.br,https://www.smttpropria.com.br',
    'STORAGE_BACKEND': 's3',
    'S3_BUCKET': 'smtt-propria-uploads-501421114665',
    'S3_REGION': 'sa-east-1',
    'S3_PREFIX': 'uploads',
    'MAIL_SERVER': 'smtp-relay.brevo.com',
    'MAIL_PORT': '587',
    'MAIL_USE_TLS': 'true',
    'MAIL_USE_SSL': 'false',
    'MAIL_SUPPRESS_SEND': 'false',
})
# docker --env-file/Compose env_file raw: values are literal, not interpolated.
for key, value in values.items():
    if value is not None and any(char in value for char in ('\r', '\n', '\x00')):
        raise SystemExit(f'Valor multiline nao suportado: {key}')
    if not key.replace('_', '').isalnum():
        raise SystemExit('Nome de variavel invalido.')
s3_credentials = root / 'generated' / 's3.env'
if not s3_credentials.exists():
    raise SystemExit('Execute create-s3-credentials.ps1 para criar a credencial IAM exclusiva deste backend.')
values.update(dotenv_values(s3_credentials, interpolate=False))
if not values.get('AWS_ACCESS_KEY_ID') or not values.get('AWS_SECRET_ACCESS_KEY'):
    raise SystemExit('Faltam credenciais IAM exclusivas do S3. Preparar credencial restrita antes de transferir.')
values.pop('AWS_SESSION_TOKEN', None)
if not values['AWS_ACCESS_KEY_ID'].startswith('AKIA'):
    raise SystemExit('Use credenciais IAM exclusivas do S3, sem sessao temporaria da CLI.')
# Never transfer Railway administrative metadata or root/local CLI credentials.
allowed = {
    'DATABASE_URL','SECRET_KEY','JWT_SECRET_KEY','APIPLACAS_TOKEN',
    'MAIL_SERVER','MAIL_PORT','MAIL_USERNAME','MAIL_PASSWORD','MAIL_DEFAULT_SENDER',
    'MAIL_USE_TLS','MAIL_USE_SSL','MAIL_TIMEOUT','MAIL_SUPPRESS_SEND',
    'CORS_ALLOWED_ORIGINS','FLASK_ENV','STORAGE_BACKEND','S3_BUCKET','S3_REGION',
    'S3_PREFIX','S3_PRESIGNED_URL_EXPIRES','AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY',
    'MAX_CONTENT_LENGTH','UPLOAD_MAX_FILE_SIZE',
}
output = root / 'generated' / 'runtime.env'
output.parent.mkdir(exist_ok=True)
output.write_text(''.join(f'{key}={values[key]}\n' for key in sorted(allowed) if values.get(key) is not None), encoding='utf-8')
print('runtime.env preparado; valores secretos nao exibidos.')
