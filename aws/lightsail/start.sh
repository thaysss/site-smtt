#!/bin/sh
set -eu
cd /opt/smtt
if [ ! -f production.env ]; then
    echo 'production.env ausente. Configure antes de iniciar.' >&2
    exit 1
fi
chmod 600 production.env
# Keep the previous image for code rollback; never remove data volumes here.
previous_container=$(docker compose -f compose.yml ps -q backend 2>/dev/null || true)
if [ -n "$previous_container" ]; then
    previous_image=$(docker inspect --format '{{.Image}}' "$previous_container")
    docker tag "$previous_image" smtt-backend:previous
fi
docker load -i backend-image.tar.gz
docker compose -f compose.yml config --quiet
docker compose -f compose.yml up -d
attempt=0
until docker compose -f compose.yml exec -T backend python -c 'import urllib.request; urllib.request.urlopen("http://localhost:5000/health", timeout=5)' >/dev/null 2>&1; do
    attempt=$((attempt+1))
    if [ "$attempt" -ge 12 ]; then
        echo 'Backend nao ficou saudavel; Vercel deve continuar no Railway.' >&2
        exit 1
    fi
    sleep 5
done
printf 'Backend saudavel. Confirmar HTTPS e entrega SMTP antes de trocar Vercel.\n'
