import { PrismaClient } from '@prisma/client'

// Prisma client singleton for database access
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Fallback para SQLite se DATABASE_URL não estiver definida
// Importante: No Vercel, o sistema de ficheiros é read-only exceto /tmp,
// mas para uma demo rápida, isto evita o crash imediato.
const dbUrl = process.env.DATABASE_URL || "file:./dev.db";

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
