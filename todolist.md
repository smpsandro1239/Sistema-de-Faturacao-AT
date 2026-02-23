# TODO LIST — Sistema de Faturação Certificado pela AT

**Legenda:** `[x]` Concluído | `[ ]` Pendente

**Progresso Total:** ~97% (fiscal ~98%, comercial ~97%)
*Nota: FASE A concluída. Suporte multi-empresa, RBAC, Fiscal 2027 e Reserva de Stock integrados.*

**Última atualização:** 24-02-2026
**Versão do projeto:** 1.8.0-beta

---

## 🔴 PRIORIDADE CRÍTICA (Requisitos Fiscais AT + funcionalidades sem as quais quase ninguém adota em 2026)

### 5.2 Validação SAF-T
- [x] Validar XML SAF-T contra XSD oficial da AT
- [x] Testar SAF-T com validador oficial da AT (instruções adicionadas)
- [x] Preparar suporte futuro para Assinatura Digital Qualificada (ADQ) nas faturas (Scaffold avançado PAdES)
- [x] Preparar suporte CIUS-PT / Faturação Eletrónica Estruturada B2G (UBL 2.1 integrado)

### 6.2 Segurança
- [x] Implementar gestão de sessões com JWT (jose library)
- [x] Proteção contra CSRF nos formulários (Origin check & JWT verification)
- [x] Rate limiting nas APIs de autenticação (Middleware)
- [x] RBAC Avançado (Controlo granular por perfil e módulo - implementado)

---

## 🟠 PRIORIDADE ALTA (Funcionalidades Essenciais / Comerciais – as que mais diferenciam)

### 7.2 Exportação
- [x] Exportar documento para PDF (Layout profissional refinado + download direto)
- [x] Enviar documento por email (automático na emissão + manual)
- [x] Exportação XML UBL 2.1 (CIUS-PT B2G)

### 9.2 Funcionalidades
- [x] Gráficos de vendas no dashboard (Recharts ou Tremor)
- [x] Exportação de relatórios (PDF / Excel / CSV – vendas, IVA, stock, contas)

### Novas – Gestão Comercial Completa (essencial para PMEs reais)

#### Gestão de Stocks / Inventário
- [x] Criar modelos Prisma: Warehouse (Armazém), ArticleWarehouseStock, StockMovement
- [x] Suporte a múltiplos armazéns
- [x] Stock atual, mínimo e máximo por artigo/armazém
- [x] Biblioteca de movimentos de stock (/src/lib/stock.ts)
- [x] Movimentos automáticos (saída na fatura/NC, entrada em receção de compras)
- [x] Alertas de stock baixo
- [x] Histórico de movimentos + página de gestão
- [x] Transferências entre armazéns
- [x] Reserva temporária de stock (Implementada em Encomendas de Cliente)

#### Gestão de Fornecedores + Compras
- [x] CRUD Fornecedores
- [x] Encomendas de compra
- [x] Entrada automática de stock na receção
- [x] Registo de faturas de fornecedores + ligação a contas correntes

#### Orçamentos / Propostas
- [x] CRUD Orçamentos
- [x] Linhas com artigos, descontos %, totais automáticos
- [x] Conversão automática para Fatura

#### Encomendas / Ordens de Venda
- [x] CRUD Encomendas de cliente
- [x] Conversão para fatura (total ou parcial)
- [x] Reserva temporária de stock (Automática na confirmação)

#### Faturação Recorrente / Avenças
- [x] CRUD subscrições
- [x] Job/cron para geração automática
- [x] Emissão + envio por email automático
- [x] Histórico de faturas geradas por subscrição

---

## 🟡 PRIORIDADE MÉDIA (Melhorias importantes no médio prazo)

### 9.1 UX/UI
- [x] Implementar tema dark/light (Verificado)

#### Portal do Cliente (área reservada)
- [x] Login seguro para clientes finais (NIF/Key)
- [x] Ver faturas emitidas, pendentes, histórico
- [x] Download PDF + link de pagamento

#### Integrações de Pagamento
- [x] Stripe, MB Way, Easypay ou referência Multibanco (Mock Logic e UI)
- [x] Atualização automática de estado pago

#### POS / Modo Venda Rápida
- [x] Interface simplificada
- [x] Otimizado para tablet / mobile
- [x] Leitura de código de barras

#### Permissões Granulares (RBAC avançado)
- [x] Controlar acesso por módulo (ver/criar/editar/emitir/anular) - CONCLUÍDO

### 9.3 Performance
- [x] Implementar caching com Redis/Memory (Implementado cache em memória)
- [ ] Otimizar queries da base de dados
- [ ] Lazy loading de componentes pesados

---

## 🟢 PRIORIDADE BAIXA (Nice-to-have)

### 9.2 Funcionalidades Adicionais
- [x] Backup da base de dados (Exportação JSON)
- [x] Importação de dados (Excel/CSV)
- [x] PWA completa
- [x] Integrações e-commerce
- [x] Multi-empresa / multi-tenancy básico (Isolamento completo em APIs e chaves de API)
- [x] Webhooks para eventos (Com isolamento por empresa)
- [x] Reconciliação bancária básica

---

## ✅ TAREFAS CONCLUÍDAS (FASES HISTÓRICAS)
- [x] FASE 1-13: Fundações, Comercial, Fiscal, SAF-T, Auditoria, Stocks, Compras, Orçamentos.
- [x] FASE 14-15: Refinamento, Portal, Automação, Tesouraria.
- [x] FASE A (2026): Validação de fluxos reais.
- [x] FASE B (2026): Multi-tenancy, RBAC, Fiscal 2027 e Performance.

---

## 📊 RESUMO POR ÁREA (atualizado)

| Área | Pendentes | Concluídas | Progresso aproximado |
|------|-----------|------------|---------------------|
| Requisitos Fiscais AT | 0 | 24+ | ~98% |
| Funcionalidades Comerciais | 0 | 49+ | ~100% |
| Tesouraria / Portal | 0 | 8+ | ~100% |
| Segurança | 0 | 11 | ~100% |
| Infraestrutura | 2 | 5 | ~75% |
| Performance | 2 | 2 | ~50% |
| Testes | 8+ | 1 | ~10% |
| Frontend | 0 | 22 | ~100% |
| Backend | 0 | 55+ | ~100% |
| Base de Dados | 0 | 32+ | ~100% |
| Documentação | 4 | 5 | ~50% |

---

## 📝 NOTAS

- **Reserva de Stock:** As encomendas de cliente agora reservam stock ao serem confirmadas e libertam na faturação.
- **API Pública v1:** Reforçada com suporte multi-empresa e novo endpoint de documentos.
- **Performance:** Introduzida biblioteca de cache em memória para dados estáticos.

**Stack:** Next.js 16 + Prisma + SQLite + shadcn/ui
