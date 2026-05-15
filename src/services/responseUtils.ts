import type { AxiosResponse } from 'axios'

export class ResponseNormalizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ResponseNormalizationError'
  }
}

export type ListPayload<T> = T[] | {
  content?: T[]
  items?: T[]
  results?: T[]
}

export type ObjectPayload<T> = T | {
  item?: T
  result?: T
  data?: T
}

export function normalizeListPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (!payload || typeof payload !== 'object') {
    throw new ResponseNormalizationError('Expected a list payload object or array.')
  }

  const record = payload as Record<string, unknown>
  if (Array.isArray(record.content)) return record.content as T[]
  if (Array.isArray(record.items)) return record.items as T[]
  if (Array.isArray(record.results)) return record.results as T[]

  throw new ResponseNormalizationError('Expected list payload to contain content, items, or results.')
}

export function normalizeListResponse<T>(
  response: AxiosResponse<{ data: ListPayload<T> }>
): AxiosResponse<{ data: T[] }> {
  return {
    ...response,
    data: {
      data: normalizeListPayload<T>(response.data?.data),
    },
  }
}

export function normalizeObjectPayload<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>

    if (record.item && typeof record.item === 'object' && !Array.isArray(record.item)) {
      return record.item as T
    }

    if (record.result && typeof record.result === 'object' && !Array.isArray(record.result)) {
      return record.result as T
    }

    if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
      return record.data as T
    }

    return record as T
  }

  throw new ResponseNormalizationError('Expected an object payload.')
}

export function normalizeObjectResponse<T>(
  response: AxiosResponse<{ data: ObjectPayload<T> }>
): AxiosResponse<{ data: T }> {
  return {
    ...response,
    data: {
      data: normalizeObjectPayload<T>(response.data?.data),
    },
  }
}

export interface NormalizedPagePayload<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

function toFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
  }
  return fallback
}

export function normalizePagePayload<T>(payload: unknown): NormalizedPagePayload<T> & Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    throw new ResponseNormalizationError('Expected a page payload object.')
  }

  const record = payload as Record<string, unknown>
  const contentSource = record.content ?? record.items ?? record.results
  if (!Array.isArray(contentSource)) {
    throw new ResponseNormalizationError('Expected page payload to contain content, items, or results.')
  }
  const content = normalizeListPayload<T>(contentSource)

  const page = toFiniteNumber(record.page ?? record.pageNumber ?? record.number, 0)
  const size = toFiniteNumber(record.size ?? record.pageSize, content.length)
  const totalElements = toFiniteNumber(record.totalElements ?? record.total, content.length)
  const computedTotalPages =
    totalElements === 0 ? 0 : Math.max(1, Math.ceil(totalElements / Math.max(size, 1)))
  const totalPages = toFiniteNumber(record.totalPages ?? record.pages, computedTotalPages)
  const defaultLast = totalPages === 0 ? true : page >= totalPages - 1
  const last = toBoolean(record.last ?? record.lastPage, defaultLast)

  return {
    ...record,
    content,
    page,
    size,
    totalElements,
    totalPages,
    last,
  }
}
