#!/bin/sh

set -e

BACKEND_URL=${BACKEND_URL:-http://backend:3000}

echo "⏳ Aguardando backend ficar disponível..."

until curl -s "$BACKEND_URL/seed" -X POST > /dev/null; do
  echo "🔁 Backend ainda não pronto. Tentando novamente em 3s..."
  sleep 3
done

echo "✅ Seed executado com sucesso!"
