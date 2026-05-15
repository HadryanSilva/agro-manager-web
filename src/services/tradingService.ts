import api from './api'
import {
  normalizeListResponse,
  normalizeObjectResponse,
  normalizePagePayload,
  type ListPayload,
  type ObjectPayload,
} from './responseUtils'

// ── Status ────────────────────────────────────────────────────────────────────

export type ClientOrderStatus = 'OPEN' | 'CLOSED'

// ── Fornecedores ──────────────────────────────────────────────────────────────

export interface TradingSupplierRequest {
  name: string
  phone?: string
  city?: string
  notes?: string
}

export interface TradingSupplierResponse {
  id: string
  name: string
  phone: string | null
  city: string | null
  notes: string | null
  createdAt: string
}

// ── Clientes ──────────────────────────────────────────────────────────────────

export interface TradingClientRequest {
  name: string
  phone: string
  city?: string
  notes?: string
}

export interface TradingClientResponse {
  id: string
  name: string
  phone: string
  city: string | null
  notes: string | null
  createdAt: string
}

// ── Caminhões e legs de pedido ────────────────────────────────────────────────

export interface OrderTruckRequest {
  truckPlate: string
  quantityKg: number
  freightValue?: number
  notes?: string
}

export interface OrderTruckResponse {
  id: string
  truckPlate: string
  quantityKg: number
  freightValue: number | null
  notes: string | null
}

export interface OrderSupplierLegRequest {
  supplierId: string
  supplierPricePerKg: number
  notes?: string
  trucks: OrderTruckRequest[]
}

export interface OrderSupplierLegResponse {
  id: string
  supplierId: string
  supplierName: string
  supplierCity: string | null
  supplierPricePerKg: number
  trucks: OrderTruckResponse[]
  totalKg: number
  totalCost: number
  notes: string | null
}

// ── Pedidos ───────────────────────────────────────────────────────────────────

export interface ClientOrderRequest {
  clientId: string
  orderDate: string
  clientPricePerKg: number
  notes?: string
  legs: OrderSupplierLegRequest[]
}

export interface ClientOrderDetailResponse {
  id: string
  clientId: string
  clientName: string
  clientPhone: string
  orderDate: string
  clientPricePerKg: number
  status: ClientOrderStatus
  legs: OrderSupplierLegResponse[]
  totalKg: number
  totalRevenue: number
  totalCost: number
  grossMargin: number
  notes: string | null
  createdAt: string
}

export interface ClientOrderSummaryResponse {
  id: string
  clientId: string
  clientName: string
  orderDate: string
  clientPricePerKg: number
  status: ClientOrderStatus
  totalKg: number
  totalRevenue: number
  totalCost: number
  grossMargin: number
  notes: string | null
  createdAt: string
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface TradingDashboardResponse {
  totalOrders: number
  openOrders: number
  closedOrders: number
  totalKg: number
  totalRevenue: number
  totalCost: number
  grossMargin: number
  totalClients: number
  totalSuppliers: number
}

// ── PageResponse genérico ─────────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ── Service ───────────────────────────────────────────────────────────────────

const tradingService = {

  // Dashboard
  getDashboard: (accountId: string) =>
    api
      .get<{ data: ObjectPayload<TradingDashboardResponse> }>(`/accounts/${accountId}/trading/dashboard`)
      .then(normalizeObjectResponse<TradingDashboardResponse>),

  // Fornecedores
  createSupplier: (accountId: string, data: TradingSupplierRequest) =>
    api
      .post<{ data: ObjectPayload<TradingSupplierResponse> }>(`/accounts/${accountId}/trading/suppliers`, data)
      .then(normalizeObjectResponse<TradingSupplierResponse>),

  listSuppliers: (accountId: string, search?: string) =>
    api
      .get<{ data: ListPayload<TradingSupplierResponse> }>(`/accounts/${accountId}/trading/suppliers`, {
        params: search ? { search } : undefined
      })
      .then(normalizeListResponse<TradingSupplierResponse>),

  getSupplier: (accountId: string, supplierId: string) =>
    api
      .get<{ data: ObjectPayload<TradingSupplierResponse> }>(`/accounts/${accountId}/trading/suppliers/${supplierId}`)
      .then(normalizeObjectResponse<TradingSupplierResponse>),

  updateSupplier: (accountId: string, supplierId: string, data: TradingSupplierRequest) =>
    api
      .put<{ data: ObjectPayload<TradingSupplierResponse> }>(`/accounts/${accountId}/trading/suppliers/${supplierId}`, data)
      .then(normalizeObjectResponse<TradingSupplierResponse>),

  deleteSupplier: (accountId: string, supplierId: string) =>
    api.delete(`/accounts/${accountId}/trading/suppliers/${supplierId}`),

  // Clientes
  createClient: (accountId: string, data: TradingClientRequest) =>
    api
      .post<{ data: ObjectPayload<TradingClientResponse> }>(`/accounts/${accountId}/trading/clients`, data)
      .then(normalizeObjectResponse<TradingClientResponse>),

  listClients: (accountId: string, search?: string) =>
    api
      .get<{ data: ListPayload<TradingClientResponse> }>(`/accounts/${accountId}/trading/clients`, {
        params: search ? { search } : undefined
      })
      .then(normalizeListResponse<TradingClientResponse>),

  getClient: (accountId: string, clientId: string) =>
    api
      .get<{ data: ObjectPayload<TradingClientResponse> }>(`/accounts/${accountId}/trading/clients/${clientId}`)
      .then(normalizeObjectResponse<TradingClientResponse>),

  updateClient: (accountId: string, clientId: string, data: TradingClientRequest) =>
    api
      .put<{ data: ObjectPayload<TradingClientResponse> }>(`/accounts/${accountId}/trading/clients/${clientId}`, data)
      .then(normalizeObjectResponse<TradingClientResponse>),

  deleteClient: (accountId: string, clientId: string) =>
    api.delete(`/accounts/${accountId}/trading/clients/${clientId}`),

  // Pedidos
  createOrder: (accountId: string, data: ClientOrderRequest) =>
    api
      .post<{ data: ObjectPayload<ClientOrderDetailResponse> }>(`/accounts/${accountId}/trading/orders`, data)
      .then(normalizeObjectResponse<ClientOrderDetailResponse>),

  listOrders: (accountId: string, params?: { status?: ClientOrderStatus; clientId?: string; page?: number; size?: number }) =>
    api
      .get<{ data: unknown }>(`/accounts/${accountId}/trading/orders`, { params })
      .then((response) => ({
        ...response,
        data: {
          data: normalizePagePayload<ClientOrderSummaryResponse>(response.data?.data) as PageResponse<ClientOrderSummaryResponse>,
        },
      })),

  getOrder: (accountId: string, orderId: string) =>
    api
      .get<{ data: ObjectPayload<ClientOrderDetailResponse> }>(`/accounts/${accountId}/trading/orders/${orderId}`)
      .then(normalizeObjectResponse<ClientOrderDetailResponse>),

  updateOrder: (accountId: string, orderId: string, data: ClientOrderRequest) =>
    api
      .put<{ data: ObjectPayload<ClientOrderDetailResponse> }>(`/accounts/${accountId}/trading/orders/${orderId}`, data)
      .then(normalizeObjectResponse<ClientOrderDetailResponse>),

  closeOrder: (accountId: string, orderId: string) =>
    api.patch(`/accounts/${accountId}/trading/orders/${orderId}/close`),

  deleteOrder: (accountId: string, orderId: string) =>
    api.delete(`/accounts/${accountId}/trading/orders/${orderId}`),

  addLeg: (accountId: string, orderId: string, data: OrderSupplierLegRequest) =>
    api
      .post<{ data: ObjectPayload<ClientOrderDetailResponse> }>(`/accounts/${accountId}/trading/orders/${orderId}/legs`, data)
      .then(normalizeObjectResponse<ClientOrderDetailResponse>),

  deleteLeg: (accountId: string, orderId: string, legId: string) =>
    api.delete(`/accounts/${accountId}/trading/orders/${orderId}/legs/${legId}`),
}

export default tradingService
