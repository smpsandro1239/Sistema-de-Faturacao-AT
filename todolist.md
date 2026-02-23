# TODO LIST — Sistema de Faturação Certificado pela AT

**Legenda:** `[x]` Concluído | `[ ]` Pendente

**Progresso Total:** ~92% (fiscal ~96%, comercial ~92%)
*Nota: FASE A (Validação de fluxos base) concluída com sucesso.*

**Última atualização:** 24-02-2026
**Versão do projeto:** 1.5.0-beta

---

## 🔴 PRIORIDADE CRÍTICA (Requisitos Fiscais AT + funcionalidades sem as quais quase ninguém adota em 2026)

### 5.2 Validação SAF-T
- [x] Validar XML SAF-T contra XSD oficial da AT
- [x] Testar SAF-T com validador oficial da AT (instruções adicionadas)
- [ ] Preparar suporte futuro para Assinatura Digital Qualificada (ADQ) nas faturas (obrigatório provável a partir de 2027/2028)
- [ ] Preparar suporte CIUS-PT / Faturação Eletrónica Estruturada B2G (obrigatório progressivo a partir de 2027)

### 6.2 Segurança
- [x] Implementar gestão de sessões com JWT (jose library)
- [x] Proteção contra CSRF nos formulários (Origin check)
- [x] Rate limiting nas APIs de autenticação (Middleware)

---

## 🟠 PRIORIDADE ALTA (Funcionalidades Essenciais / Comerciais – as que mais diferenciam)

### 7.2 Exportação
- [x] Exportar documento para PDF (melhorar layout atual + opção de download direto) - jsPDF implementado
- [x] Enviar documento por email (automático na emissão + manual)

### 9.2 Funcionalidades
- [x] Gráficos de vendas no dashboard (Recharts ou Tremor – mensal, por cliente, por artigo)
- [x] Exportação de relatórios (PDF / Excel / CSV – vendas, IVA, stock, contas)

### Novas – Gestão Comercial Completa (essencial para PMEs reais)

#### Gestão de Stocks / Inventário
- [x] Criar modelos Prisma: Warehouse (Armazém), ArticleWarehouseStock, StockMovement
- [x] Suporte a múltiplos armazéns
- [x] Stock atual, mínimo e máximo por artigo/armazém
- [x] Biblioteca de movimentos de stock (/src/lib/stock.ts)
- [x] Movimentos automáticos (saída na fatura/NC, entrada em receção de compras) - fluxo validado
- [x] Alertas de stock baixo (dashboard + API)
- [x] Histórico de movimentos + página de gestão
- [x] Transferências entre armazéns (com validação de destino)

#### Gestão de Fornecedores + Compras
- [x] CRUD Fornecedores (semelhante a Clientes: NIF, morada, contactos, IBAN)
- [x] Encomendas de compra (estados: rascunho, enviada, confirmada, parcialmente recebida, recebida, cancelada)
- [x] Entrada automática de stock na receção - fluxo validado
- [x] Registo de faturas de fornecedores + ligação a contas correntes

#### Orçamentos / Propostas
- [x] CRUD Orçamentos (estados: rascunho, enviado, aceite, rejeitado, expirado)
- [x] Linhas com artigos, descontos %, totais automáticos
- [x] Conversão automática para Fatura - fluxo validado com atualização de stock

#### Encomendas / Ordens de Venda
- [x] CRUD Encomendas de cliente (estados: rascunho, confirmada, em preparação, faturada, cancelada)
- [x] Conversão para fatura (total ou parcial)
- [ ] Reserva temporária de stock (opcional)

#### Faturação Recorrente / Avenças
- [x] CRUD subscrições (cliente, frequência: mensal/semanal/anual, linhas fixas/variáveis)
- [x] Job/cron para geração automática
- [x] Emissão + envio por email automático
- [x] Histórico de faturas geradas por subscrição

---

## 🟡 PRIORIDADE MÉDIA (Melhorias importantes no médio prazo)

### 9.1 UX/UI
- [ ] Implementar tema dark/light

#### Portal do Cliente (área reservada)
- [x] Login seguro para clientes finais (NIF/Key)
- [x] Ver faturas emitidas, pendentes, histórico (Dashboard)
- [x] Download PDF + link de pagamento (ex: MB Way/Easypay)

#### Integrações de Pagamento
- [x] Stripe, MB Way, Easypay ou referência Multibanco (Mock Logic e UI)
- [x] Atualização automática de estado pago

#### POS / Modo Venda Rápida
- [x] Interface simplificada (busca artigo rápida, totalizador, pagamento)
- [x] Otimizado para tablet / mobile
- [x] Leitura de código de barras (Scanner integration)

#### Permissões Granulares (RBAC avançado)
- [x] Controlar acesso por módulo (ver/criar/editar/emitir/anular)

### 9.3 Performance
- [ ] Implementar caching com Redis/Memory
- [ ] Otimizar queries da base de dados
- [ ] Lazy loading de componentes pesados

---

## 🟢 PRIORIDADE BAIXA (Nice-to-have)

### 9.2 Funcionalidades Adicionais
- [x] Backup da base de dados (Exportação JSON)
- [x] Importação de dados (Excel/CSV – clientes, artigos, stock inicial)
- [x] PWA completa (offline support básico, installável)
- [x] Integrações e-commerce (WooCommerce / Shopify – webhook receiver)
- [ ] Multi-empresa / multi-tenancy básico
- [x] Webhooks para eventos (fatura emitida, pagamento recebido)
- [x] Reconciliação bancária básica (Importação e matching)

---

## ✅ TAREFAS CONCLUÍDAS (FASES HISTÓRICAS)
- [x] FASE 1-13: Fundações, Comercial, Fiscal, SAF-T, Auditoria, Stocks, Compras, Orçamentos.
- [x] FASE 14-15: Refinamento, Portal, Automação, Tesouraria.
- [x] FASE A (2026): Validação de fluxos reais (Orçamentos, Compras, Stock, Pagamentos).

---

## 📊 RESUMO POR ÁREA (atualizado)

| Área | Pendentes | Concluídas | Progresso aproximado |
|------|-----------|------------|---------------------|
| Requisitos Fiscais AT | 2 | 22+ | ~96% |
| Funcionalidades Comerciais | 1 | 45+ | ~98% |
| Tesouraria / Portal | 0 | 8+ | ~100% |
| Segurança | 2 | 8 | ~80% |
| Infraestrutura | 3 | 4 | ~60% |
| Performance | 3 | 1 | ~25% |
| Testes | 8+ | 0 | ~5% |
| Frontend | 1 | 20 | ~95% |
| Backend | 2 | 45+ | ~98% |
| Base de Dados | 0 | 30+ | ~100% |
| Documentação | 4 | 5 | ~50% |

---

## 📝 NOTAS

- **Fluxos Validados:** O sistema agora garante que a conversão de orçamentos e a receção de compras refletem corretamente no stock.
- **Pagamentos:** Implementado registo de pagamentos parciais/totais para documentos de venda.
- **Seed:** Novo script `seed_fase_a` disponível para popular o sistema com dados funcionais.

**Stack:** Next.js 16 + Prisma + SQLite (ou PostgreSQL recomendado para produção) + shadcn/ui
