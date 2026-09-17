FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY smtt_backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# O frontend permanece no Vercel; somente o backend entra na imagem do Railway.
COPY smtt_backend/ .

RUN useradd --create-home --uid 10001 app && chown -R app:app /app

USER app

EXPOSE 5000

CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-5000} --workers ${WEB_CONCURRENCY:-2} --threads 2 --timeout 60 run:app"]
