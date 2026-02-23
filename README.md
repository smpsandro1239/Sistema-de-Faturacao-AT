# FaturaAT — Sistema de Faturação Certificado (Portugal)

Sistema completo de faturação certificado pela Autoridade Tributária (AT), focado em PMEs reais. Concorrente direto de Moloni, Vendus e InvoiceXpress.

## 🚀 Funcionalidades Implementadas

### ⚖️ Fiscal & Conformidade (AT)
- **Algoritmo de Hash Certificado**: Selagem de documentos com SHA1 encadeado.
- **ATCUD & QR Code**: Geração automática de códigos obrigatórios.
- **SAF-T PT**: Exportação completa do ficheiro de auditoria (XML 1.04).
- **Validação AT**: Lógica pronta para submissão e conformidade total.

### 💼 Gestão Comercial
- **POS (Ponto de Venda)**: Interface de venda rápida otimizada para retalho com suporte PWA.
- **Portal do Cliente**: Área segura para consulta de documentos e pagamentos online (Mock Stripe/MBWay).
- **Stocks & Inventário**: Suporte a múltiplos armazéns, movimentos automáticos e alertas de stock baixo.
- **Compras & Fornecedores**: Ciclo completo de compras, registo de faturas de fornecedor e pagamentos.
- **Vendas & Orçamentos**: Emissão de Faturas, Faturas-Recibo e Notas de Crédito. Conversão de orçamentos e encomendas.
- **Avenças (Faturação Recorrente)**: Gestão de subscrições com processamento automático em lote.
- **Contas Correntes**: Controlo de saldos pendentes de clientes e fornecedores.

### 📊 Inteligência de Negócio & Conectividade
- **API Pública (v1)**: Integração via API Key para Clientes e Artigos.
- **Webhooks**: Notificações em tempo real para emissão e pagamento de documentos.
- **E-commerce Receiver**: Endpoint para recepção de pedidos e criação automática de rascunhos.
- **Dashboard Avançado**: Gráficos de evolução de vendas, top de clientes e top de artigos (Recharts).
- **Relatórios Profissionais**: Exportação de dados de vendas para Excel (XLSX) e CSV com resumo de IVA.
- **Automação de Email**: Envio de faturas PDF diretamente para o cliente com links seguros.

## 🛠️ Stack Tecnológica

- **Framework**: Next.js 15 (App Router)
- **Base de Dados**: Prisma ORM (SQLite em dev, PostgreSQL em prod)
- **UI/UX**: Tailwind CSS 4, shadcn/ui, Lucide Icons
- **Gráficos**: Recharts
- **Relatórios**: ExcelJS
- **Segurança**: JWT (jose), bcryptjs, Rate Limiting, CSRF Protection, Zod Validation, RBAC.
- **Email**: Nodemailer

## 🚀 Início Rápido

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Configurar Base de Dados**:
   ```bash
   npx prisma db push
   ```

3. **Iniciar Desenvolvimento**:
   ```bash
   npm run dev
   ```

## 🔒 Produção (PostgreSQL)

Para ambiente de produção, é obrigatória a utilização de PostgreSQL. Consulte o ficheiro [POSTGRES_MIGRATION.md](./POSTGRES_MIGRATION.md) para instruções detalhadas de migração.

## 📁 Estrutura do Projeto

- `src/app/api`: Endpoints REST protegidos.
- `src/components`: Componentes UI reutilizáveis.
- `src/lib`: Lógica de negócio (fiscal, hash, pdf, email).
- `prisma/`: Esquema da base de dados.

---
Desenvolvido para conformidade rigorosa com os requisitos fiscais portugueses.
