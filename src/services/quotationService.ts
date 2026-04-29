import api from './api'

export interface QuotationResponse {
  id: string
  productName: string
  supplier: string
  unitPrice: number
  quantity: number
  unit: string | null
  totalPrice: number
  quotationDate: string
  notes: string | null
  farmId: string | null
  farmName: string | null
  createdAt: string
}

export interface QuotationGroupResponse {
  productName: string
  quotationCount: number
  minUnitPrice: number
  maxUnitPrice: number
  avgUnitPrice: number
  potentialSavings: number
  cheapestSupplier: string
  quotations: QuotationResponse[]
}

export interface QuotationRequest {
  productName: string
  supplier: string
  unitPrice: number
  quantity: number
  unit?: string
  quotationDate: string
  notes?: string
  farmId?: string | null
}

const quotationService = {
  create: (accountId: string, payload: QuotationRequest) =>
    api.post<{ data: QuotationResponse }>(`/accounts/${accountId}/quotations`, payload),

  listGrouped: (accountId: string) =>
    api.get<{ data: QuotationGroupResponse[] }>(`/accounts/${accountId}/quotations`),

  getProductSuggestions: (accountId: string) =>
    api.get<{ data: string[] }>(`/accounts/${accountId}/quotations/products`),

  update: (accountId: string, quotationId: string, payload: QuotationRequest) =>
    api.put<{ data: QuotationResponse }>(`/accounts/${accountId}/quotations/${quotationId}`, payload),

  delete: (accountId: string, quotationId: string) =>
    api.delete(`/accounts/${accountId}/quotations/${quotationId}`),
}

export default quotationService