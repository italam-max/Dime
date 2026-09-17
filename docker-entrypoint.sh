#!/bin/sh
# Entrypoint del contenedor Dime: aplica migraciones versionadas y arranca Next.
set -e

echo "▲ Dime — aplicando migraciones (prisma migrate deploy)…"
npx prisma migrate deploy

echo "▲ Dime — iniciando servidor en el puerto ${PORT:-3000}…"
exec npm run start
