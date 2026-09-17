#!/bin/sh
# Entrypoint del contenedor Dime: aplica migraciones versionadas y arranca Next.
set -e

echo "▲ Dime — aplicando migraciones (prisma migrate deploy)…"
npx prisma migrate deploy

# Datos de demo opcionales: solo si SEED_DEMO=true. El seed está protegido
# (no siembra si la base ya tiene usuarios), así que es seguro en redeploys.
if [ "$SEED_DEMO" = "true" ]; then
  echo "▲ Dime — SEED_DEMO=true: sembrando demo si la base está vacía…"
  npx prisma db seed || echo "▲ Dime — seed omitido o con error (continúo)."
fi

echo "▲ Dime — iniciando servidor en el puerto ${PORT:-3000}…"
exec npm run start
