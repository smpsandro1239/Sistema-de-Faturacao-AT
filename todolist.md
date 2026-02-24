# TODO LIST — Sistema de Faturação Certificado pela AT

**Legenda:** [x] Concluído | [ ] Pendente

**Progresso Total:** ~75% (fiscal ~95%, comercial ~45%)

**Última atualização:** 24-02-2026
**Versão do projeto:** 1.0.0-beta

🔴 OPORTUNIDADES DE DESTAQUE VS CONCORRENTES (2026 – onde Moloni/Vendus/InvoiceXpress/PHC GO/Jasmin ganham)
- POS móvel/retalho/restauração (Vendus forte em mesas/pedidos, Moloni apps Android/iOS)
- Gestão avançada de stocks: múltiplos armazéns + transferências + alertas reais + leitura código barras (Moloni/PHC GO)
- Integrações e-commerce diretas/plugins (WooCommerce/Shopify – Moloni/Jasmin)
- Faturação recorrente + envio email automático/templates personalizáveis (InvoiceXpress/Moloni)
- Portal do cliente com histórico + download PDF + pagamento online (InvoiceXpress)
- API pública + webhooks para automações externas (Moloni/InvoiceXpress)
- [x] Contas correntes clientes/fornecedores + tesouraria básica (PHC GO)

🔴 PRIORIDADE CRÍTICA (Requisitos Fiscais AT + funcionalidades sem as quais quase ninguém adota in 2026)
5.2 Validação SAF-T
 [x] Validar XML SAF-T contra XSD oficial da AT
 [x] Testar SAF-T com validador oficial da AT (instruções adicionadas)
- Preparar suporte futuro para Assinatura Digital Qualificada (ADQ) nas faturas (obrigatório provável a partir de 2027/2028)
- Preparar suporte CIUS-PT / Faturação Eletrónica Estruturada B2G (obrigatório progressivo a partir de 2027)

6.2 Segurança
 [x] Implementar gestão de sessões com JWT (jose library)
 [x] Proteção contra CSRF nos formulários (Origin check no Middleware)
 [x] Rate limiting nas APIs de autenticação (Middleware/Rota)

🟠 PRIORIDADE ALTA (Funcionalidades Essenciais / Comerciais – as que mais diferenciam)
7.2 Exportação
 [ ] Exportar documento para PDF (melhorar layout atual + opção de download direto)
 [ ] Enviar documento por email (automático na emissão + manual + templates personalizáveis como InvoiceXpress/Moloni)

9.2 Funcionalidades
 [ ] Gráficos de vendas no dashboard (Recharts ou Tremor – mensal, por cliente, por artigo)
 [ ] Exportação de relatórios (PDF / Excel / CSV – vendas, IVA, stock, contas)

Novas – Gestão Comercial Completa (essencial para PMEs reais)
- Gestão de Stocks / Inventário
  - [ ] Criar modelos Prisma: Warehouse, ArticleWarehouseStock, StockMovement
  - [ ] Suporte a múltiplos armazéns + transferências entre armazéns (como Moloni)
  - [ ] Stock atual, mínimo e máximo por artigo/armazém
  - [ ] Movimentos automáticos (saída na fatura/NC, entrada em receção de compras)
  - [ ] Alertas de stock baixo (dashboard + email opcional)
  - [ ] Histórico de movimentos + CRUD manual + leitura código barras opcional
- Gestão de Fornecedores + Compras
  - [ ] CRUD Fornecedores (semelhante a Clientes: NIF, morada, contactos, IBAN)
  - [ ] Encomendas de compra (estados: rascunho, confirmada, parcialmente recebida, concluída, cancelada)
  - [x] Registo de faturas de fornecedores + ligação a contas correntes básicas (como PHC GO)
  - [ ] Entrada automática de stock na receção
- Orçamentos / Propostas
  - [ ] CRUD Orçamentos (estados: rascunho, enviado, aceite, rejeitado, expirado)
  - [ ] Linhas com artigos, descontos %, totais automáticos
  - [ ] Conversão automática para Encomenda ou Fatura
- Encomendas / Ordens de Venda
  - [ ] CRUD Encomendas de cliente (estados: rascunho, confirmada, em preparação, faturada, cancelada)
  - [ ] Conversão para fatura (total ou parcial)
  - [ ] Reserva temporária de stock (opcional)
- Faturação Recorrente / Avenças
  - [ ] CRUD subscrições (cliente, frequência: mensal/semanal/anual, linhas fixas/variáveis)
  - [ ] Job/cron para geração automática
  - [ ] Emissão + envio por email automático (templates como InvoiceXpress)
  - [ ] Histórico de faturas geradas por subscrição
- POS / Modo Venda Rápida (oportunidade Vendus/Moloni)
  - [ ] Interface simplificada para venda rápida (busca artigo, totalizador, pagamento)
  - [ ] Suporte mobile/tablet (PWA ou app básica)
  - [ ] Modo retalho/restauração opcional (mesas/pedidos – futuro)

🟡 PRIORIDADE MÉDIA (Melhorias importantes no médio prazo)
9.1 UX/UI
 [ ] Implementar tema dark/light
- Portal do Cliente (área reservada – oportunidade InvoiceXpress)
  - [ ] Login separado para clientes finais
  - [ ] Ver faturas emitidas, pendentes, histórico
  - [ ] Download PDF + link de pagamento (ex: MB Way/Easypay/Stripe)
- Integrações de Pagamento
  - [ ] Stripe, MB Way, Easypay ou referência Multibanco
  - [ ] Atualização automática de estado pago
- Permissões Granulares (RBAC avançado)
  - [ ] Controlar acesso por módulo (ver/criar/editar/emitir/anular)
- API Pública + Webhooks (oportunidade Moloni/InvoiceXpress)
  - [ ] Endpoints para clientes/artigos/documentos
  - [ ] Webhooks para eventos (emitido, pago)

9.3 Performance
 [ ] Implementar caching com Redis/Memory
 [ ] Otimizar queries da base de dados
 [ ] Lazy loading de componentes pesados

🟢 PRIORIDADE BAIXA (Nice-to-have)
9.2 Funcionalidades Adicionais
 [ ] Backup da base de dados
 [ ] Importação de dados (Excel/CSV – clientes, artigos, stock inicial)
- PWA completa (offline support básico, installável)
- Integrações e-commerce diretas/plugins (WooCommerce/Shopify – oportunidade Moloni/Jasmin)
- Multi-empresa / multi-tenancy básico

---

## ✅ TAREFAS CONCLUÍDAS (FASES HISTÓRICAS)
- [x] FASE 1: Fundações e Certificação AT (Hash, ATCUD, QR Code, SAF-T)
- [x] FASE 2: Gestão Comercial Básica (Clientes, Artigos, Séries)

---

## 📊 RESUMO POR ÁREA (atualizado)

| Área | Pendentes | Concluídas | Progresso aproximado |
|------|-----------|------------|---------------------|
| Requisitos Fiscais AT | 2 | 15+ | ~95% |
| Funcionalidades Comerciais | 17+ | 13+ | ~45% |
| Segurança | 0 | 7 | ~100% |
| Frontend | 4 | 16 | ~80% |
| Backend | 8 | 32 | ~80% |

---

## 📝 NOTAS

- **Prioridade:** Stocks -> Fornecedores/Compras -> Orçamentos -> Email -> Encomendas -> Recorrentes -> Relatórios -> API Pública.

**Stack:** Next.js 16 + Prisma + SQLite + shadcn/ui + Tailwind + jose + Zod
