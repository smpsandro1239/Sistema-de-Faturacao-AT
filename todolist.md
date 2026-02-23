# TODO LIST — Sistema de Faturação Certificado pela AT

**Legenda:** `[x]` Concluído | `[ ]` Pendente

**Progresso Total:** ~88–92% (fiscal ~95%, comercial ~82–86%)

**Última atualização:** 23-02-2026
**Versão do projeto:** 1.1.0-beta

---

## 🔴 PRIORIDADE CRÍTICA (Requisitos Fiscais AT + funcionalidades sem as quais quase ninguém adota em 2026)

### 5.2 Validação SAF-T
- [x] Validar XML SAF-T contra XSD oficial da AT
- [x] Testar SAF-T com validador oficial da AT (instruções adicionadas)
- [ ] Preparar suporte futuro para Assinatura Digital Qualificada (ADQ) nas faturas (obrigatório provável a partir de 2027/2028)
- [x] Preparar suporte CIUS-PT / Faturação Eletrónica Estruturada B2G (Biblioteca UBL 2.1 implementada)

### 6.2 Segurança
- [x] Implementar gestão de sessões com JWT (jose library)
- [x] Proteção contra CSRF nos formulários (Origin/Referer check em rotas críticas)
- [x] Rate limiting nas APIs de autenticação (Middleware implementado)

---

## 🟠 PRIORIDADE ALTA (Funcionalidades Essenciais / Comerciais – as que mais diferenciam)

### 7.2 Exportação
- [x] Exportar documento para PDF (melhorar layout atual + suporte a logótipo da empresa)
- [ ] Enviar documento por email (automático na emissão + manual)
- [x] Relatório de IVA detalhado por taxa (resumo contabilístico no Excel)

### 9.2 Funcionalidades
- [x] Gráficos de vendas no dashboard (Recharts - Top Clientes, Top Artigos, Evolução Mensal)
- [x] Exportação de relatórios (Excel / CSV – vendas, clientes, IVA)

### Novas – Gestão Comercial Completa (essencial para PMEs reais)

#### Gestão de Stocks / Inventário
- [x] Criar modelos Prisma: Warehouse (Armazém), ArticleWarehouseStock, StockMovement
- [x] Suporte a múltiplos armazéns
- [x] Stock atual, mínimo e máximo por artigo/armazém
- [x] Biblioteca de movimentos de stock (/src/lib/stock.ts)
- [x] Movimentos automáticos (saída na fatura/NC, entrada em receção de compras) - funções criadas
- [x] Alertas de stock baixo (dashboard + API)
- [x] Histórico de movimentos + página de gestão

#### Gestão de Fornecedores + Compras
- [x] CRUD Fornecedores (semelhante a Clientes: NIF, morada, contactos, IBAN)
- [x] Encomendas de compra (estados: rascunho, enviada, confirmada, parcialmente recebida, recebida, cancelada)
- [x] Entrada automática de stock na receção
- [ ] Registo de faturas de fornecedores + ligação a contas correntes

#### Orçamentos / Propostas
- [x] CRUD Orçamentos (estados: rascunho, enviado, aceite, rejeitado, expirado)
- [x] Linhas com artigos, descontos %, totais automáticos
- [x] Conversão automática para Fatura

#### Encomendas / Ordens de Venda
- [x] CRUD Encomendas de cliente (estados: rascunho, confirmada, faturada)
- [x] Conversão para fatura total
- [ ] Reserva temporária de stock (opcional)

#### Faturação Recorrente / Avenças
- [x] CRUD subscrições (frequência: mensal/semanal/anual)
- [x] Endpoint de processamento em lote para geração de faturas
- [ ] Emissão + envio por email automático (templates em progresso)
- [x] Histórico de faturas geradas por subscrição

---

## 🟡 PRIORIDADE MÉDIA (Melhorias importantes no médio prazo)

### 9.1 UX/UI
- [ ] Implementar tema dark/light

#### Portal do Cliente (área reservada)
- [x] Login seguro via accessKey (UUID) por documento
- [x] Ver faturas emitidas, pendentes, histórico
- [x] Download PDF + link de pagamento (MB WAY / Cartão de Crédito Mock)

#### Integrações de Pagamento
- [x] MB Way e Cartão de Crédito (Interface e Mock Logic)
- [x] Atualização automática de estado pago

#### POS / Modo Venda Rápida
- [x] Interface simplificada (busca artigo rápida, totalizador, pagamento)
- [x] Otimizado para tablet / mobile (Layout responsivo implementado)

#### Permissões Granulares (RBAC avançado)
- [ ] Controlar acesso por módulo (ver/criar/editar/emitir/anular)

### 9.3 Performance
- [ ] Implementar caching com Redis/Memory
- [ ] Otimizar queries da base de dados
- [ ] Lazy loading de componentes pesados

---

## 🟢 PRIORIDADE BAIXA (Nice-to-have)

### 9.2 Funcionalidades Adicionais
- [ ] Backup da base de dados
- [ ] Importação de dados (Excel/CSV – clientes, artigos, stock inicial)
- [ ] PWA completa (offline support básico, installável)
- [x] Integrações e-commerce (WooCommerce / Shopify – webhook ou API)
- [ ] Multi-empresa / multi-tenancy básico
- [ ] Webhooks para eventos (fatura emitida, pagamento recebido)

---

## 📋 TAREFAS DE MELHORIA DETETADAS AUTOMATICAMENTE

### 🧪 Testes
- [ ] Criar testes unitários para funções de hash
- [ ] Criar testes unitários para validação de NIF
- [ ] Criar testes unitários para geração de ATCUD
- [ ] Criar testes unitários para geração de QR Code
- [ ] Criar testes de integração para APIs
- [ ] Criar testes end-to-end para fluxo de emissão de documentos
- [ ] Testar compatibilidade com diferentes browsers
- [ ] Testes E2E para fluxos comerciais (orçamento → encomenda → fatura → stock)

### 🔒 Segurança
- [x] Implementar validação de inputs em todos os endpoints
- [ ] Adicionar proteção XSS nos formulários
- [ ] Implementar logs de segurança (tentativas de login falhadas)
- [ ] Verificar e atualizar dependências vulneráveis
- [ ] Implementar HTTPS em produção
- [ ] Configurar headers de segurança (CSP, HSTS)

### 💻 Frontend
- [ ] Otimizar imagens e assets
- [ ] Implementar tratamento de erros global
- [ ] Melhorar acessibilidade (WCAG 2.1)
- [ ] Adicionar feedback visual em todas as operações

### ⚙️ Backend
- [ ] Criar documentação da API (OpenAPI/Swagger ou Scalar)
- [ ] Implementar logs estruturados
- [ ] Adicionar monitorização de performance
- [ ] Implementar gestão de erros centralizada
- [ ] Configurar timeouts adequados

### 🗄️ Base de Dados
- [ ] Criar script de backup automático
- [ ] Implementar migrações consistentes
- [ ] Revisão de índices para performance (especialmente stocks e documentos)
- [ ] Configurar conexões pooling

### 🚀 Infraestrutura / DevOps
- [ ] Configurar CI/CD pipeline
- [ ] Separar ambientes (dev/staging/prod)
- [ ] Configurar monitorização e alertas
- [ ] Preparar Dockerfile para deployment
- [ ] Configurar CDN para assets estáticos

### 📚 Documentação
- [ ] Atualizar README com instruções do projeto
- [ ] Criar guia de instalação detalhado
- [ ] Criar documentação da API
- [ ] Criar diagramas de arquitetura
- [ ] Criar CHANGELOG
- [ ] Documentar variáveis de ambiente

---

## ✅ TAREFAS CONCLUÍDAS

### FASE 1 — Fundações Técnicas
- [x] Criar repositórios Git (frontend, backend, infra)
- [x] Definir stack tecnológica (Next.js 16 + Prisma + SQLite)
- [x] Criar projeto Backend (API Routes)
- [x] Criar projeto Frontend (Next.js)
- [x] Criar estrutura base de pastas (API + Frontend)
- [x] Criar tabela Empresa
- [x] Criar tabela Clientes
- [x] Criar tabela Artigos
- [x] Criar tabela TaxasIVA
- [x] Criar tabela IsencaoIVA
- [x] Criar tabela Series
- [x] Criar tabela Documentos
- [x] Criar tabela LinhasDocumento
- [x] Criar tabela Pagamentos
- [x] Criar tabela Utilizadores
- [x] Criar tabela Auditoria
- [x] Criar índices essenciais
- [x] Definir perfis (Admin, Gestor, Operador, Consulta)
- [x] Implementar modelo de permissões no schema

### FASE 2 — Gestão Comercial
- [x] Criar página de listagem de clientes
- [x] Criar endpoints CRUD clientes
- [x] Validar NIF português
- [x] Implementar pesquisa e filtros
- [x] Implementar ativar/desativar cliente
- [x] Criar diálogo de criação/edição de clientes
- [x] Criar página de listagem de artigos
- [x] Criar endpoints CRUD artigos
- [x] Associar taxas de IVA
- [x] Implementar gestão de isenções
- [x] Implementar ativar/desativar artigo
- [x] Criar diálogo de criação/edição de artigos
- [x] Criar página de gestão de séries
- [x] Criar séries por tipo de documento
- [x] Implementar código ATCUD configurável
- [x] Implementar ativação/desativação de séries
- [x] Bloquear edição de séries após uso
- [x] Criar endpoints CRUD séries

### FASE 3 — Emissão de Documentos
- [x] Criar página de listagem de documentos
- [x] Criar documento em rascunho
- [x] Adicionar linhas ao documento
- [x] Calcular totais (base, IVA, total)
- [x] Emitir documento (estado final)
- [x] Impedir edição após emissão
- [x] Criar página de visualização individual
- [x] Criar endpoints CRUD documentos
- [x] Criar modelo para NC referenciando documento original

### FASE 4 — Requisitos Fiscais
- [x] Implementar algoritmo SHA-256
- [x] Encadear hash com documento anterior
- [x] Guardar hash no documento
- [x] Criar biblioteca de hash (/src/lib/hash.ts)
- [x] Implementar geração automática do ATCUD
- [x] Integrar código de validação da série
- [x] Validar formato do ATCUD
- [x] Instalar biblioteca qrcode
- [x] Implementar gerador de QR Code
- [x] Incluir campos obrigatórios da AT
- [x] Integrar QR Code na visualização do documento
- [x] Criar biblioteca de QR Code (/src/lib/qrcode.ts)

### FASE 5 — SAF-T (PT)
- [x] Criar página SAF-T com histórico
- [x] Criar estrutura XML conforme schema oficial
- [x] Implementar secção Header
- [x] Implementar secção MasterFiles
- [x] Implementar secção SourceDocuments
- [x] Incluir hashes e ATCUD
- [x] Criar endpoint /api/saf-t
- [x] Validar XML SAF-T contra estrutura oficial (validação completa)

### FASE 6 — Auditoria e Segurança
- [x] Criar página de Auditoria
- [x] Registar ações críticas
- [x] Guardar valores antigos/novos (JSON)
- [x] Implementar consulta de logs com filtros
- [x] Criar biblioteca de auditoria (/src/lib/auditoria.ts)
- [x] Impedir DELETE em documentos emitidos
- [x] Bloquear séries após uso
- [x] Implementar autenticação básica (página de login)
- [x] Implementar hashing seguro de passwords (bcrypt)
- [x] Criar biblioteca de autenticação (/src/lib/auth.ts)
- [x] Utilizador admin criado no seed

### FASE 7 — Impressão e Exportação
- [x] Criar layout de impressão profissional
- [x] Incluir QR Code no documento impresso
- [x] Incluir ATCUD no documento impresso
- [x] Incluir informações fiscais (hash, certificado)
- [x] Exportar documento para impressão (window.print)

### FASE 8 — Dados de Demonstração
- [x] Criar API de seed (/api/seed)
- [x] Inserir empresa de demonstração
- [x] Inserir taxas de IVA
- [x] Inserir isenções de IVA
- [x] Inserir séries de demonstração
- [x] Inserir clientes de exemplo
- [x] Inserir artigos de exemplo
- [x] Inserir utilizador admin
- [x] Criar script de seed CLI (prisma/seed.ts)
- [x] Suporte a documentos de exemplo no seed
- [x] Múltiplos utilizadores (admin, gestor, operador)
- [x] Armazéns de exemplo no seed
- [x] Fornecedores de exemplo no seed

### FASE 9 — Melhorias
- [x] Implementar responsividade completa para mobile
- [x] Adicionar loading states (skeletons)
- [x] Adicionar toast notifications (sonner)
- [x] Implementar paginação nas tabelas
- [x] Dashboard com dados reais da API
- [x] API de estatísticas (/api/estatisticas)
- [x] Página de configurações da empresa
- [x] Sistema de seeds completo com CLI

### FASE 10 — Stocks e Fornecedores
- [x] Criar modelos Prisma para Stocks (Armazém, ArtigoArmazemStock, MovimentoStock)
- [x] Criar modelos Prisma para Fornecedores (Fornecedor, EncomendaCompra, LinhaEncomendaCompra)
- [x] Atualizar modelo Artigo com campos de stock
- [x] Criar API CRUD Fornecedores
- [x] Criar API CRUD Armazéns
- [x] Criar página de gestão de Fornecedores
- [x] Criar página de gestão de Armazéns
- [x] Adicionar links no Dashboard

### FASE 11 — Movimentos de Stock
- [x] Criar biblioteca de movimentos de stock (/src/lib/stock.ts)
- [x] Implementar funções de entrada/saída/transferência
- [x] Criar API de movimentos de stock
- [x] Criar API de alertas de stock baixo
- [x] Criar página de histórico de movimentos
- [x] Integrar alertas de stock no dashboard
- [x] Funções para movimentos automáticos na fatura/NC

### FASE 12 — Encomendas de Compra
- [x] Criar API CRUD para Encomendas de Compra (/api/compras/encomendas)
- [x] Criar API de receção com entrada de stock automática
- [x] Criar página de gestão de Encomendas de Compra
- [x] Implementar estados: rascunho, enviada, confirmada, parcial, recebida, cancelada
- [x] Integração completa com stock na receção

### FASE 13 — Orçamentos / Propostas
- [x] Criar modelos Prisma: Orcamento, LinhaOrcamento, EstadoOrcamento
- [x] Criar API CRUD para Orçamentos (/api/orcamentos)
- [x] Criar API de conversão para fatura (/api/orcamentos/[id]/converter)
- [x] Criar página de gestão de Orçamentos
- [x] Implementar estados: rascunho, enviado, aceite, rejeitado, expirado, convertido
- [x] Conversão automática com geração de hash e ATCUD
- [x] Atualizar dashboard com link para Orçamentos

---

## 📊 RESUMO POR ÁREA (atualizado)

| Área | Pendentes | Concluídas | Progresso aproximado |
|------|-----------|------------|---------------------|
| Requisitos Fiscais AT | 2–4 | 23+ | 95–96% |
| Funcionalidades Comerciais | 3–4 | 40+ | 88–92% |
| Performance | 3 | 1 | ~25% |
| Testes | 8+ | 0 | ~5% |
| Segurança | 4 | 7 | ~65% |
| Frontend | 3–4 | 16 | ~82% |
| Backend | 4–5 | 35+ | ~92% |
| Base de Dados | 4 | 22+ | ~88% |
| Infraestrutura | 3 | 3 | ~45–50% |
| Documentação | 5 | 3–4 | ~40% |

---

## 📝 NOTAS

- **Foco imediato (próximos 4–8 meses):** Email automático → Encomendas de venda → Recorrentes → Relatórios
- Não pedir certificação final AT até ter as funcionalidades 🔴 implementadas e testadas
- PDF simples continua válido como fatura eletrónica até final de 2026; preparar ADQ para 2027+
- Priorizar o que resolve dores reais: follow-up de vendas, automação de envios
- Evitar over-engineering nas primeiras funcionalidades novas – lançar MVP utilizável → iterar com feedback

**Stack:** Next.js 16 + Prisma + SQLite (ou PostgreSQL recomendado para produção) + shadcn/ui
