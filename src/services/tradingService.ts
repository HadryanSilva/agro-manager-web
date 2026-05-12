import api from './api'

// ── Tipos de status ───────────────────────────────────────────────────────────

export type PurchaseLotStatus = 'OPEN' | 'CLOSED'

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

// ── Lotes e caminhões de compra ───────────────────────────────────────────────

export interface PurchaseTruckRequest {
  truckPlate: string
  quantityKg: number
  notes?: string
}

export interface PurchaseTruckResponse {
  id: string
  truckPlate: string
  quantityKg: number
  notes: string | null
}

export interface PurchaseLotRequest {
  supplierId: string
  purchaseDate: string
  pricePerKg: number
  trucks: PurchaseTruckRequest[]
  notes?: string
}

export interface PurchaseLotSummaryResponse {
  id: string
  supplierId: string
  supplierName: string
  purchaseDate: string
  pricePerKg: number
  status: PurchaseLotStatus
  totalPurchasedKg: number
  totalSoldKg: number
  remainingKg: number
  totalCost: number
  notes: string | null
  createdAt: string
}

export interface LotSaleTruckResponse {
  id: string
  truckPlate: string
  quantityKg: number
  notes: string | null
}

export interface LotSaleResponse {
  id: string
  buyerName: string
  saleDate: string
  pricePerKg: number
  trucks: LotSaleTruckResponse[]
  totalKg: number
  totalRevenue: number
  notes: string | null
  createdAt: string
}

export interface PurchaseLotDetailResponse {
  id: string
  supplierId: string
  supplierName: string
  supplierCity: string | null
  purchaseDate: string
  pricePerKg: number
  status: PurchaseLotStatus
  purchaseTrucks: PurchaseTruckResponse[]
  sales: LotSaleResponse[]
  totalPurchasedKg: number
  totalSoldKg: number
  remainingKg: number
  totalCost: number
  totalRevenue: number
  grossMargin: number
  notes: string | null
  createdAt: string
}

// ── Vendas ────────────────────────────────────────────────────────────────────

export interface LotSaleTruckRequest {
  truckPlate: string
  quantityKg: number
  notes?: string
}

export interface LotSaleRequest {
  buyerName: string
  saleDate: string
  pricePerKg: number
  trucks: LotSaleTruckRequest[]
  notes?: string
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface TradingDashboardResponse {
  totalLots: number
  openLots: number
  closedLots: number
  totalPurchasedKg: number
  totalSoldKg: number
  totalCost: number
  totalRevenue: number
  grossMargin: number
  totalSuppliers: number
}

// ── PageResponse genérico (mesmo padrão do backend) ──────────────────────────

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
    api.get<{ data: TradingDashboardResponse }>(`/accounts/${accountId}/trading/dashboard`),

  // Fornecedores
  createSupplier: (accountId: string, data: TradingSupplierRequest) =>
    api.post<{ data: TradingSupplierResponse }>(`/accounts/${accountId}/trading/suppliers`, data),

  listSuppliers: (accountId: string, search?: string) =>
    api.get<{ data: TradingSupplierResponse[] }>(`/accounts/${accountId}/trading/suppliers`, {
      params: search ? { search } : undefined
    }),

  getSupplier: (accountId: string, supplierId: string) =>
    api.get<{ data: TradingSupplierResponse }>(`/accounts/${accountId}/trading/suppliers/${supplierId}`),

  updateSupplier: (accountId: string, supplierId: string, data: TradingSupplierRequest) =>
    api.put<{ data: TradingSupplierResponse }>(`/accounts/${accountId}/trading/suppliers/${supplierId}`, data),

  deleteSupplier: (accountId: string, supplierId: string) =>
    api.delete(`/accounts/${accountId}/trading/suppliers/${supplierId}`),

  // Lotes de compra
  createLot: (accountId: string, data: PurchaseLotRequest) =>
    api.post<{ data: PurchaseLotDetailResponse }>(`/accounts/${accountId}/trading/purchases`, data),

  listLots: (accountId: string, params?: { status?: PurchaseLotStatus; supplierId?: string; page?: number; size?: number }) =>
    api.get<{ data: PageResponse<PurchaseLotSummaryResponse> }>(`/accounts/${accountId}/trading/purchases`, { params }),

  getLot: (accountId: string, lotId: string) =>
    api.get<{ data: PurchaseLotDetailResponse }>(`/accounts/${accountId}/trading/purchases/${lotId}`),

  updateLot: (accountId: string, lotId: string, data: PurchaseLotRequest) =>
    api.put<{ data: PurchaseLotDetailResponse }>(`/accounts/${accountId}/trading/purchases/${lotId}`, data),

  closeLot: (accountId: string, lotId: string) =>
    api.patch(`/accounts/${accountId}/trading/purchases/${lotId}/close`),

  deleteLot: (accountId: string, lotId: string) =>
    api.delete(`/accounts/${accountId}/trading/purchases/${lotId}`),

  // Vendas
  createSale: (accountId: string, lotId: string, data: LotSaleRequest) =>
    api.post<{ data: LotSaleResponse }>(`/accounts/${accountId}/trading/purchases/${lotId}/sales`, data),

  deleteSale: (accountId: string, lotId: string, saleId: string) =>
    api.delete(`/accounts/${accountId}/trading/purchases/${lotId}/sales/${saleId}`),
}

export default tradingService
