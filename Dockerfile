# Dockerfile para FaturaAT - Modo Standalone
FROM oven/bun:1.1 as base
WORKDIR /app

# Instalar dependências
FROM base as deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build da aplicação
FROM base as builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Configurar Prisma
RUN bunx prisma generate
RUN bun run build

# Runner para produção
FROM base as runner
WORKDIR /app
ENV NODE_ENV production

# Utilizador não-root por segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
