# Design: Frontend — Telas de Pedidos de Clientes

**Data:** 2026-05-13
**Domínio:** trader (modo comprador)
**Status:** aprovado

---

## Contexto

O backend implementou o recurso `CustomerOrder` com CRUD completo (`/accounts/{id}/trading/orders`) e tornou `customerOrderId` obrigatório na criação de `PurchaseLot`. O frontend precisa expor essas APIs com novas telas integradas ao `TraderLayout` existente.

---

## Decisões

| Questão | Decisão |
|---|---|
| Posição na nav | Novo item "Pedidos de Clientes" na sidebar, entre Fornecedores e Lotes de Compra |
| Form de pedido | Página dedicada (como `PurchaseLotFormView`), não modal |
| Picker de pedido no form de lote | Card com resumo do pedido selecionado + lista dropdown de PENDING |
| Abordagem de implementação | Incremental — sem componentes compartilhados entre as telas |

---

## Arquivos

### Novos

```
src/views/trader/CustomerOrdersView.vue      ← lista com filtro PENDING/FULFILLED
src/views/trader/CustomerOrderFormView.vue   ← criar/editar pedido
```

### Modificados

```
src/services/tradingService.ts              ← tipos + métodos CRUD de orders
src/router/index.ts                         ← 3 rotas novas
src/layouts/TraderLayout.vue                ← novo navItem na sidebar
src/views/trader/PurchaseLotFormView.vue    ← card-picker + CreatePurchaseLotRequest
src/views/trader/PurchaseLotDetailView.vue  ← bloco "Pedido do Cliente"
```

---

## Tipos novos em `tradingService.ts`

```typescript
export type CustomerOrderStatus = 'PENDING' | 'FULFILLED'

export interface CustomerOrderResponse {
  id: string
  customerName: string
  customerPhone: string | null
  customerDocument: string | null
  quantityKg: number
  pricePerKg: number | null
  product: string
  orderDate: string
  deliveryDeadline: string | null
  status: CustomerOrderStatus
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CustomerOrderRequest {
  customerName: string
  customerPhone?: string
  customerDocument?: string
  quantityKg: number
  pricePerKg?: number
  product: string
  orderDate: string
  deliveryDeadline?: string
  notes?: string
}

// Substitui PurchaseLotRequest no endpoint POST de criação
export interface CreatePurchaseLotRequest {
  customerOrderId: string
  supplierId: string
  purchaseDate: string
  pricePerKg: number
  trucks: PurchaseTruckRequest[]
  notes?: string
}
```

Métodos adicionados ao `tradingService`:

```typescript
createOrder(accountId, data: CustomerOrderRequest): Promise<CustomerOrderResponse>
listOrders(accountId, params?: { status?: CustomerOrderStatus }): Promise<CustomerOrderResponse[]>
getOrder(accountId, orderId): Promise<CustomerOrderResponse>
updateOrder(accountId, orderId, data: CustomerOrderRequest): Promise<CustomerOrderResponse>
deleteOrder(accountId, orderId): Promise<void>
```

O método `createLot` passa a aceitar `CreatePurchaseLotRequest` (com `customerOrderId` obrigatório) em vez de `PurchaseLotRequest`.

---

## Rotas novas (`router/index.ts`)

Dentro do bloco `TraderLayout`, adicionar:

```typescript
{ path: 'orders', name: 'trader-orders', component: () => import('@/views/trader/CustomerOrdersView.vue') }
{ path: 'orders/new', name: 'trader-orders-new', component: () => import('@/views/trader/CustomerOrderFormView.vue') }
{ path: 'orders/:orderId/edit', name: 'trader-orders-edit', component: () => import('@/views/trader/CustomerOrderFormView.vue') }
```

---

## TraderLayout — navItem

Inserir entre `trader-suppliers` e `trader-lots`:

```typescript
{
  name: 'trader-orders',
  label: 'Pedidos de Clientes',
  icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
}
```

---

## CustomerOrdersView

**Cabeçalho:** título "Pedidos de Clientes" + subtítulo + botão "Novo Pedido" → `trader-orders-new`.

**Filtro de status:** botões pill — Todos / Pendentes / Atendidos. Padrão: Todos.

**Lista:** cards, um por pedido, ordenados por `orderDate DESC`.

**Card de pedido:**
- Linha 1: `customerName` (bold) + badge de status
- Linha 2: `product · Pedido: {orderDate} · Prazo: {deliveryDeadline}`
- Linha 3: métricas — Qtd (kg), Preço/Kg, CPF/CNPJ (quando preenchido)
- Ações: botões "Editar" e "Excluir" — **desabilitados** quando status = FULFILLED
- Badge PENDENTE: fundo laranja claro, texto laranja escuro
- Badge ATENDIDO: fundo verde claro, texto verde escuro
- Cards FULFILLED: opacidade reduzida (0.85) para indicar imutabilidade

**Estado vazio:** mensagem + botão "Criar primeiro pedido".

**Loading state:** spinner centralizado (padrão da app).

**Delete:** modal de confirmação inline (padrão `TradingSuppliersView`).

---

## CustomerOrderFormView

**Modo duplo:** cria quando rota é `trader-orders-new`; edita quando tem `route.params.orderId`.

**Breadcrumb:** "← Pedidos de Clientes" navega de volta.

**Seção 1 — Dados do Cliente:**
- `customerName` (obrigatório, full-width)
- `customerPhone` + `customerDocument` (2 colunas)

**Seção 2 — Dados do Pedido:**
- `product` (obrigatório, 2/3 da largura) + `quantityKg` (obrigatório, 1/3)
- `pricePerKg` + `orderDate` (obrigatório) + `deliveryDeadline` (3 colunas)
- `notes` (full-width, textarea)

**Ações:** "Cancelar" (volta à lista) + "Salvar Pedido" / "Atualizar Pedido".

**Error handling:** banner de erro acima do botão de submit, igual aos demais forms.

**Restrição:** formulário não é acessível para pedidos FULFILLED (redireciona à lista).

---

## PurchaseLotFormView — card-picker

O campo de seleção de pedido aparece no topo do formulário, antes dos campos existentes.

**Estado vazio (nenhum pedido selecionado):**
- Card tracejado com placeholder "Selecionar pedido PENDING..."
- Clique abre lista inline de pedidos PENDING disponíveis

**Lista de seleção:**
- Cada item: `customerName` (bold) + `product · quantityKg · Prazo: deliveryDeadline` + badge PENDING
- Clique em item → fecha lista, preenche o card selecionado

**Estado selecionado:**
- Card com borda verde sólida
- Conteúdo: `customerName` (bold) + `product · quantityKg · Prazo: deliveryDeadline`
- Botão "Trocar" permite alterar a seleção

**Validação:** campo obrigatório — não permite submit sem pedido selecionado.

**Estado vazio de pedidos:** se não há pedidos PENDING, mostra mensagem "Nenhum pedido disponível. Crie um pedido de cliente primeiro." com link para `trader-orders-new`.

**Edição de lote:** em modo edição o picker fica desabilitado — `customerOrder` não é editável após criação (não existe endpoint para trocar o pedido).

---

## PurchaseLotDetailView — bloco Pedido do Cliente

Novo bloco inserido logo após o grid de KPIs, antes de "Caminhões de Recebimento".

**Conteúdo:**
- Label "PEDIDO DO CLIENTE" (uppercase, muted)
- `customerName` (bold, 0.875rem)
- `product · quantityKg solicitados · Prazo: deliveryDeadline`
- `Preço acordado: pricePerKg/Kg` (quando preenchido)
- Badge ATENDIDO (verde) alinhado à direita

**Estilo:** borda esquerda verde (`border-left: 3px solid var(--color-primary)`) para distinguir visualmente do restante.

---

## Error handling

- Pedido não encontrado ao editar: redireciona para `trader-orders` silenciosamente.
- Criar lote com pedido já FULFILLED (race condition): exibe erro do backend (409 CONFLICT).
- Campos obrigatórios: validação client-side antes do submit, sem submit duplo.

---

## Fluxo operacional completo

```
1. Usuário cria CustomerOrder → status PENDING
2. Lista de pedidos mostra badge laranja "PENDENTE"
3. Usuário cria PurchaseLot → seleciona o pedido no card-picker
4. Detalhe do lote exibe bloco "Pedido do Cliente" com badge "ATENDIDO"
5. Lista de pedidos: o pedido agora tem badge verde "ATENDIDO", botões desabilitados
```
