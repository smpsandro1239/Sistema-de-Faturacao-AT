# FaturaAT — Sistema de Faturação Certificado pela AT

Um sistema completo de faturação certificado pela Autoridade Tributária portuguesa (AT), desenvolvido com tecnologias modernas para PMEs reais.

## ✨ Funcionalidades Principais

### ⚖️ Conformidade Fiscal AT
- **Hash Encadeado**: Implementação rigorosa do algoritmo SHA-256 conforme a Portaria 363/2010.
- **ATCUD**: Geração automática do Código Único de Documento.
- **QR Code**: Integrado em todos os documentos conforme os requisitos legais.
- **SAF-T (PT)**: Exportação e validação completa do ficheiro XML.
- **Auditoria**: Registo detalhado de todas as operações críticas do sistema.

### 📦 Gestão Comercial
- **Documentos**: Faturas, Faturas-Recibo, Notas de Crédito e Orçamentos.
- **Stocks**: Gestão multi-armazém, transferências entre armazéns e alertas de stock baixo.
- **Compras**: Encomendas de compra a fornecedores com receção automática de stock.
- **Fornecedores**: Gestão completa de base de dados de fornecedores.
- **Faturas de Fornecedores**: Registo e controlo de faturas recebidas.
- **Orçamentos**: Propostas comerciais com conversão direta para fatura.

### 📊 Dashboard e Relatórios
- **Estatísticas em tempo real**: Volume de faturação, faturas do dia, clientes ativos.
- **Gráficos**: Vendas mensais e distribuição por tipo de documento.
- **Alertas**: Notificações visuais de stock baixo e documentos pendentes.

## 🚀 Stack Tecnológica

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Estilo**: Tailwind CSS + shadcn/ui
- **Base de Dados**: Prisma ORM + SQLite (PostgreSQL recomendado para produção)
- **Autenticação**: JWT (jose) + bcryptjs
- **Notificações**: Sonner (Toasts)
- **Gráficos**: Recharts

## 🛠️ Instalação e Desenvolvimento

\`\`\`bash
# Instalar dependências
npm install

# Configurar base de dados
npx prisma generate
npx prisma db push

# Povoar base de dados
npm run seed

# Iniciar servidor
npm run dev
\`\`\`

## 🔐 Segurança

O sistema implementa:
- Gestão de sessões via JWT.
- Hashing de passwords com bcrypt.
- Bloqueio de documentos e séries após emissão/uso.
- Logs de auditoria imutáveis.

---
Desenvolvido como um sistema robusto e seguro para o mercado português. 🚀
