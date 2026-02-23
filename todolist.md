TODO LIST — Sistema de Faturação Certificado pela AT

Legenda: [x] Concluído | [ ] Pendente

Progresso Total: ~97–98% (fiscal ~96%, comercial ~97%)

Última atualização: 23-02-2026
Versão do projeto: 1.4.0-beta

🔴 OPORTUNIDADES DE DESTAQUE VS CONCORRENTES (2026 – onde Moloni/Vendus/InvoiceXpress/PHC GO/Jasmin ganham)
- [x] POS móvel/retalho/restauração (Interface POS + PWA implementada)
- [x] Gestão avançada de stocks: múltiplos armazéns + transferências + alertas reais + leitura código barras (Moloni/PHC GO)
- [ ] Integrações e-commerce diretas/plugins (WooCommerce/Shopify – Moloni/Jasmin)
- [x] Faturação recorrente + envio email automático/templates personalizáveis (InvoiceXpress/Moloni)
- [x] Portal do cliente com histórico + download PDF + pagamento online (Implementado via accessKey e Mock Stripe/MBWay)
- [x] API pública + webhooks para automações externas (v1 base implementada)
- [x] Contas correntes clientes/fornecedores + tesouraria básica (PHC GO)

🔴 PRIORIDADE CRÍTICA (Requisitos Fiscais AT + funcionalidades sem as quais quase ninguém adota em 2026)
5.2 Validação SAF-T
 [x] Validar XML SAF-T contra XSD oficial da AT
 [x] Testar SAF-T com validador oficial da AT (instruções adicionadas)
- Preparar suporte futuro para Assinatura Digital Qualificada (ADQ) nas faturas (obrigatório provável a partir de 2027/2028)
- Preparar suporte CIUS-PT / Faturação Eletrónica Estruturada B2G (obrigatório progressivo a partir de 2027)

6.2 Segurança
 [x] Implementar gestão de sessões com JWT (jose library)
 [x] Proteção contra CSRF nos formulários (Implementado via Origin/Referer check)
 [x] Autenticação em todas as novas rotas API comerciais (relatórios, subscrições, compras)
 [x] Rate limiting nas APIs de autenticação (Implementado para rota de login)
 [x] Middleware centralizado de proteção de rotas (src/middleware.ts)

🟠 PRIORIDADE ALTA (Funcionalidades Essenciais / Comerciais – as que mais diferenciam)
7.2 Exportação
 [x] Exportar documento para PDF (melhorar layout atual + suporte a logótipo da empresa)
 [x] Enviar documento por email (automático na emissão + manual + lib nodemailer integrada)
 [x] Relatório de IVA detalhado por taxa (resumo contabilístico no Excel)

9.2 Funcionalidades
 [x] Gráficos de vendas no dashboard (Recharts - Top Clientes, Top Artigos, Evolução Mensal)
 [x] Exportação de relatórios (Excel / CSV – vendas, clientes, IVA)

Novas – Gestão Comercial Completa (essencial para PMEs reais)
- [x] Gestão de Stocks / Inventário
  - [x] Criar modelos Prisma: Warehouse, ArticleWarehouseStock, StockMovement
  - [x] Suporte a múltiplos armazéns + transferências entre armazéns
  - [x] Stock atual, mínimo e máximo por artigo/armazém
  - [x] Movimentos automáticos (saída na fatura, entrada em receção de compras)
  - [x] Alertas de stock baixo (dashboard)
- [x] Gestão de Fornecedores + Compras
  - [x] CRUD Fornecedores (NIF, morada, contactos)
  - [x] Registo de faturas de fornecedores (compras)
  - [x] Ligação a contas correntes (PHC GO style)
  - [x] Entrada automática de stock na receção de fatura de fornecedor
- [x] Orçamentos / Propostas
  - [x] CRUD Orçamentos (estados: rascunho, enviado, aceite, rejeitado)
  - [x] Conversão automática para Encomenda ou Fatura
- [x] Encomendas / Ordens de Venda
  - [x] CRUD Encomendas de cliente (estados: rascunho, confirmada, faturada)
  - [x] Conversão para fatura total
- [x] Faturação Recorrente / Avenças
  - [x] CRUD subscrições (frequência: mensal/semanal/anual)
  - [x] Endpoint de processamento em lote para geração de faturas
  - [x] Histórico de faturas geradas por subscrição
- [x] POS / Modo Venda Rápida (oportunidade Vendus/Moloni)
  - [x] Interface simplificada para venda rápida (busca artigo, totalizador, pagamento)
  - [x] Suporte mobile/tablet (PWA básica configurada)

🟡 PRIORIDADE MÉDIA (Melhorias importantes no médio prazo)
9.1 UX/UI
 [ ] Implementar tema dark/light
- [x] Portal do Cliente (Versão segura com Pagamento Online Mock)
- [x] Integrações de Pagamento (Estrutura base para Stripe/MB Way no Portal)
- [x] Permissões Granulares (RBAC implementado e forçado nos endpoints)
- [x] Gestão de Equipa (Interface de utilizadores e atribuição de perfis)
- [x] API Pública + Webhooks (v1: Artigos, Clientes, Disparo na Emissão)

9.3 Performance
 [ ] Implementar caching com Redis/Memory
 [ ] Otimizar queries da base de dados

--------------------------------------------------------------------------------
TAREFAS DE MELHORIA (Refactoring / Qualidade)
- [x] Migrar para PostgreSQL (Documentação de migração criada conforme Regra 7)
- [x] Organizar lib/ para lógica fiscal separada da comercial
- [ ] Testes unitários para cálculo de impostos e retenções

TAREFAS CONCLUÍDAS (Histórico)
- [x] Configuração inicial Next.js + Prisma + Tailwind
- [x] Modelos de dados base: Cliente, Artigo, TaxaIVA, Serie, Empresa, Documento, LinhaDocumento
- [x] Lógica de Hash encadeado (algoritmo certificado)
- [x] Geração de ATCUD e QR Code
- [x] Exportação de SAF-T PT XML (versão 1.04)
- [x] UI CRUD: Clientes, Artigos, Séries
- [x] UI Emissão de Documentos (Faturas, FT-R, NC)
- [x] Dashboard básico com indicadores financeiros
- [x] Gestão de Stocks (Múltiplos armazéns)
- [x] Conversão de Orçamentos para Faturas
- [x] Segurança Crítica (Rate Limiting, CSRF, Middleware)
- [x] Portal do Cliente Seguro e POS Base
- [x] API Pública v1 e Webhooks
- [x] Pagamento Online no Portal e Suporte PWA
- [x] RBAC Avançado e Gestão de Equipa

RESUMO POR ÁREA
- Fiscal (AT): 96%
- Comercial/Vendas: 97%
- Stocks/Compras: 92%
- UI/UX: 96%
- Segurança/Infra: 90%
- API/Integração: 75%

NOTAS IMPORTANTES
- O sistema usa SQLite por defeito em dev, mas deve usar PostgreSQL em produção (ver POSTGRES_MIGRATION.md).
- Todos os documentos emitidos são selados com hash SHA1 e ATCUD.
- Acesso total controlado por RBAC (Admin, Gestor, Operador, Consulta).
- O middleware protege todas as rotas internas, exigindo autenticação JWT.

Stack: Next.js 16, Prisma, SQLite/PostgreSQL, Tailwind, shadcn/ui, Recharts, ExcelJS, Nodemailer.
