import { PrismaClient } from '@prisma/client'

// Prisma client singleton for database access
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Gestão de Ligação à Base de Dados
 *
 * Prioridade:
 * 1. DATABASE_URL (Ambiente de produção ou local configurado - PostgreSQL recomendado)
 * 2. SQLite Local (Apenas fallback para desenvolvimento se DATABASE_URL estiver vazia)
 *
 * NOTA: No Vercel, o uso de SQLite (/tmp/dev.db) é volátil.
 * É obrigatório configurar DATABASE_URL com uma instância PostgreSQL (Render/Supabase/Neon)
 * para persistência de dados real.
 */
const getDatabaseUrl = () => {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl) return envUrl;

  // Fallback apenas para desenvolvimento local se não houver ENV
  return "file:./dev.db";
};

const dbUrl = getDatabaseUrl();

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
