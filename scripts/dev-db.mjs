#!/usr/bin/env node
// PostgreSQL local para desarrollo, sin Docker (usa embedded-postgres).
// Uso:  npm run db:up | db:down | db:status
// Los datos viven en ~/.dime-dev-pg (fuera del repo); los binarios los provee
// la devDependency embedded-postgres, así que sobreviven a `npm ci`.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PGDATA = join(homedir(), ".dime-dev-pg");
const PORT = "5432";
const URL = "postgresql://dime_user:dime_dev_password@localhost:5432/dime_db?schema=public";

function binDir() {
  const base = join(process.cwd(), "node_modules", "@embedded-postgres");
  if (!existsSync(base)) {
    throw new Error("Faltan los binarios de Postgres. Corre `npm install` primero.");
  }
  const pkg = readdirSync(base).find((d) =>
    existsSync(join(base, d, "native", "bin", "pg_ctl"))
  );
  if (!pkg) throw new Error("No encontré los binarios de Postgres para tu plataforma.");
  return join(base, pkg, "native", "bin");
}

const BIN = binDir();
const bin = (name) => join(BIN, name);
const run = (file, args) => spawnSync(file, args, { stdio: "inherit" });

async function createRoleAndDb() {
  const { PrismaClient } = await import("@prisma/client");
  const admin = new PrismaClient({
    datasources: { db: { url: "postgresql://postgres@localhost:5432/postgres" } },
  });
  for (const sql of [
    "CREATE ROLE dime_user LOGIN PASSWORD 'dime_dev_password' SUPERUSER",
    "CREATE DATABASE dime_db OWNER dime_user",
  ]) {
    try {
      await admin.$executeRawUnsafe(sql);
    } catch {
      /* ya existe: ok */
    }
  }
  await admin.$disconnect();
}

const cmd = process.argv[2] ?? "up";

if (cmd === "up") {
  const fresh = !existsSync(join(PGDATA, "PG_VERSION"));
  if (fresh) {
    run(bin("initdb"), [
      "-D", PGDATA, "-U", "postgres",
      "--auth-host=trust", "--auth-local=trust", "-E", "UTF8",
    ]);
  }
  run(bin("pg_ctl"), [
    "-D", PGDATA, "-l", join(PGDATA, "server.log"),
    "-o", `-p ${PORT} -k /tmp`, "-w", "start",
  ]);
  if (fresh) {
    await createRoleAndDb();
    console.log("\nCluster nuevo. Ahora aplica el esquema y datos de ejemplo:");
    console.log("  npx prisma migrate deploy && npm run db:seed\n");
  }
  console.log(`PostgreSQL arriba en localhost:${PORT}`);
  console.log(`DATABASE_URL=${URL}`);
} else if (cmd === "down") {
  run(bin("pg_ctl"), ["-D", PGDATA, "stop"]);
} else if (cmd === "status") {
  run(bin("pg_ctl"), ["-D", PGDATA, "status"]);
} else {
  console.log("Uso: node scripts/dev-db.mjs [up|down|status]");
  process.exit(1);
}
