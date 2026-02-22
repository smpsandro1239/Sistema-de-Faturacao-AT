# Guia de Migração para PostgreSQL

Este projeto utiliza atualmente **SQLite** para desenvolvimento, mas para produção recomenda-se vivamente o uso de **PostgreSQL** para garantir escalabilidade, integridade de dados e performance.

## Requisitos
- Instância do PostgreSQL (local ou managed como Supabase, Neon, AWS RDS)
- Variável de ambiente `DATABASE_URL` configurada

## Passos para Migração

### 1. Alterar o Provider no Prisma
No ficheiro `prisma/schema.prisma`, altera o bloco `datasource`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Atualizar as Variáveis de Ambiente
No teu ficheiro `.env`, atualiza a `DATABASE_URL`:

```env
DATABASE_URL="postgresql://utilizador:password@localhost:5432/nome_base_dados?schema=public"
```

### 3. Gerar o Cliente Prisma e Aplicar Schema
Executa os seguintes comandos para inicializar a base de dados PostgreSQL com o schema atual:

```bash
# Gerar o cliente Prisma para PostgreSQL
npx prisma generate

# Sincronizar o schema com a nova base de dados
npx prisma db push
```

### 4. Migrar Dados Existentes (Opcional)
Se precisares de mover dados do `dev.db` (SQLite) para o PostgreSQL, recomenda-se o uso de ferramentas como:
- **pgLoader**: Excelente para migrações automatizadas.
- **Drizzle-kit pull/push** ou scripts manuais via JSON.

### 5. Repovoar com Seed
Podes reinicializar os dados de demonstração no PostgreSQL:

```bash
bun run seed --init
```

## Notas Específicas PostgreSQL
- O PostgreSQL é case-sensitive em nomes de tabelas/colunas se forem usados quotes, mas o Prisma lida com isso automaticamente.
- O tipo `DateTime` no PostgreSQL preserva milissegundos.
- Enums no Prisma serão mapeados para tipos ENUM nativos do PostgreSQL ou tabelas de lookup dependendo da configuração.
