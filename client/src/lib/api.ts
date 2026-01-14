const BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('token')
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...init.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new ApiError(res.status, body.error ?? 'Request failed')
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string) =>
      request<{ token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },

  properties: {
    list: () => request<import('../types').Property[]>('/properties'),
    create: (data: unknown) =>
      request<import('../types').Property>('/properties', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    get: (id: string) => request<import('../types').Property>(`/properties/${id}`),
    delete: (id: string) => request<void>(`/properties/${id}`, { method: 'DELETE' }),
  },

  deals: {
    list: () => request<import('../types').Deal[]>('/deals'),
    create: (data: unknown) =>
      request<{ id: string }>('/deals', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) =>
      request<{ deal: import('../types').Deal; scenarios: import('../types').Scenario[] }>(
        `/deals/${id}`,
      ),
    delete: (id: string) => request<void>(`/deals/${id}`, { method: 'DELETE' }),
    toggleShare: (id: string) =>
      request<{ shareToken: string | null }>(`/deals/${id}/share`, { method: 'POST' }),
    addScenario: (dealId: string, data: unknown) =>
      request<{ id: string }>(`/deals/${dealId}/scenarios`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    proforma: (dealId: string, scenarioId: string) =>
      request<import('../types').ProformaResult>(`/deals/${dealId}/scenarios/${scenarioId}/proforma`),
    sensitivity: (dealId: string, scenarioId: string, data: unknown) =>
      request(`/deals/${dealId}/scenarios/${scenarioId}/sensitivity`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    shared: (token: string) =>
      request<{
        deal: { id: string; name: string }
        proforma: import('../types').ProformaResult
      }>(`/deals/shared/${token}`),
  },
}
