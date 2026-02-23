TODO LIST — Sistema de Faturação Certificado pela AT

Legenda: [x] Concluído | [ ] Pendente

Progresso Total: ~92–95% (fiscal ~95%, comercial ~92–95%)

Última atualização: 23-02-2026
Versão do projeto: 1.2.0-beta

🔴 OPORTUNIDADES DE DESTAQUE VS CONCORRENTES (2026 – onde Moloni/Vendus/InvoiceXpress/PHC GO/Jasmin ganham)
- [x] POS móvel/retalho/restauração (Interface POS simplificada implementada)
- [x] Gestão avançada de stocks: múltiplos armazéns + transferências + alertas reais + leitura código barras (Moloni/PHC GO)
- [ ] Integrações e-commerce diretas/plugins (WooCommerce/Shopify – Moloni/Jasmin)
- [x] Faturação recorrente + envio email automático/templates personalizáveis (InvoiceXpress/Moloni)
- [x] Portal do cliente com histórico + download PDF (Acesso seguro via accessKey implementado)
- [ ] API pública + webhooks para automações externas (Moloni/InvoiceXpress)
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

🟠 PRIORIDADE ALTA (Funcionalidades Essenciais / Comerciais – as que mais diferenciam)
7.2 Exportação
 [x] Exportar documento para PDF (melhorar layout atual + suporte a logótipo da empresa)
 [x] Enviar documento por email (automático na emissão + manual + lib nodemailer integrada)

9.2 Funcionalidades
 [x] Gráficos de vendas no dashboard (Recharts - Top Clientes, Top Artigos, Evolução Mensal)
 [x] Exportação de relatórios (Excel / CSV – vendas, clientes)

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
  - [ ] Suporte mobile/tablet (PWA ou app básica)

🟡 PRIORIDADE MÉDIA (Melhorias importantes no médio prazo)
9.1 UX/UI
 [ ] Implementar tema dark/light
- [x] Portal do Cliente (Versão segura via link único com accessKey)
- [ ] Integrações de Pagamento (Stripe, MB Way, Easypay)
- [ ] Permissões Granulares (RBAC avançado)
- [ ] API Pública + Webhooks (oportunidade Moloni/InvoiceXpress)

9.3 Performance
 [ ] Implementar caching com Redis/Memory
 [ ] Otimizar queries da base de dados

🟢 PRIORIDADE BAIXA (Nice-to-have)
9.2 Funcionalidades Adicionais
 [ ] Backup da base de dados
 [ ] Importação de dados (Excel/CSV – clientes, artigos, stock inicial)
- [ ] PWA completa
- [ ] Integrações e-commerce diretas (WooCommerce/Shopify)
- [ ] Multi-empresa / multi-tenancy básico

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
- [x] Segurança Crítica (Rate Limiting, CSRF)
- [x] Portal do Cliente Seguro e POS Base

RESUMO POR ÁREA
- Fiscal (AT): 95%
- Comercial/Vendas: 95%
- Stocks/Compras: 90%
- UI/UX: 90%
- API/Integração: 30%

NOTAS IMPORTANTES
- O sistema usa SQLite por defeito em dev, mas deve usar PostgreSQL em produção (ver POSTGRES_MIGRATION.md).
- Todos os documentos emitidos são selados com hash SHA1 e ATCUD.
- O acesso ao Portal do Cliente é agora feito via accessKey única enviada por email.

Stack: Next.js 15, Prisma, SQLite/PostgreSQL, Tailwind, shadcn/ui, Recharts, ExcelJS, Nodemailer.
