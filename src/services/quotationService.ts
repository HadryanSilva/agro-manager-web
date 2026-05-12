import api from './api'
import {
  normalizeListResponse,
  normalizeObjectResponse,
  type ListPayload,
  type ObjectPayload,
} from './responseUtils'

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
    api
      .post<{ data: ObjectPayload<QuotationResponse> }>(`/accounts/${accountId}/quotations`, payload)
      .then(normalizeObjectResponse<QuotationResponse>),

  listGrouped: (accountId: string) =>
    api
      .get<{ data: ListPayload<QuotationGroupResponse> }>(`/accounts/${accountId}/quotations`)
      .then(normalizeListResponse<QuotationGroupResponse>),

  getProductSuggestions: (accountId: string) =>
    api
      .get<{ data: ListPayload<string> }>(`/accounts/${accountId}/quotations/products`)
      .then(normalizeListResponse<string>),

  update: (accountId: string, quotationId: string, payload: QuotationRequest) =>
    api
      .put<{ data: ObjectPayload<QuotationResponse> }>(`/accounts/${accountId}/quotations/${quotationId}`, payload)
      .then(normalizeObjectResponse<QuotationResponse>),

  delete: (accountId: string, quotationId: string) =>
    api.delete(`/accounts/${accountId}/quotations/${quotationId}`),
}

export default quotationService