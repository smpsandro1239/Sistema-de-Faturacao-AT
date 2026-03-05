import { PrismaClient } from '@prisma/client'

// Prisma client singleton for database access
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Gestão de Ligação à Base de Dados
 *
 * Prioridade:
 * 1. DATABASE_URL (Ambiente de produção ou local configurado)
 * 2. SQLite Local (Desenvolvimento ou demo rápida)
 *
 * NOTA: No Vercel, o sistema de ficheiros é read-only exceto em /tmp.
 * Usar SQLite em produção no Vercel não é recomendado para persistência.
 */
const getDatabaseUrl = () => {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl) return envUrl;

  // Se estivermos na Vercel sem URL, tentamos usar /tmp (será volátil)
  if (process.env.VERCEL) {
    return "file:/tmp/dev.db";
  }

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
