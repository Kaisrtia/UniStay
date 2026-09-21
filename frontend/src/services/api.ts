import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'react-toastify'

const resolveApiBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined

  if (!apiUrl && import.meta.env.PROD) {
    throw new Error('VITE_API_URL is required for production builds.')
  }

  return (apiUrl || 'http://localhost:6969/api/v1').replace(/\/$/, '')
}

export const API_BASE_URL = resolveApiBaseUrl()

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
  _retryCount?: number
  _skipRetry?: boolean
  _skipAuthRefresh?: boolean
}

type JwtPayload = {
  exp?: number
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

const getJwtPayload = (token: string) => {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decodedPayload = window.atob(normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '='))
    return JSON.parse(decodedPayload) as JwtPayload
  } catch {
    return null
  }
}

const isTokenExpiredOrExpiringSoon = (token: string) => {
  const payload = getJwtPayload(token)
  if (!payload?.exp) return false

  return payload.exp * 1000 <= Date.now() + 30_000
}

api.interceptors.request.use(async (config) => {
  let token = localStorage.getItem('accessToken')

  if (token && !shouldSkipRefresh(config) && isTokenExpiredOrExpiringSoon(token)) {
    try {
      refreshSessionRequest = refreshSessionRequest || refreshSession()
      token = await refreshSessionRequest
    } catch {
      clearStoredAuthSession()
      token = null
    } finally {
      refreshSessionRequest = null
    }
  }

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

let refreshSessionRequest: Promise<string> | null = null

const clearStoredAuthSession = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('token')
  localStorage.removeItem('authUser')
  window.dispatchEvent(new Event('auth-user-updated'))
}

const shouldSkipRefresh = (config?: RetryableRequestConfig) => {
  const url = config?.url || ''

  return (
    Boolean(config?._skipAuthRefresh) ||
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/sessions/refresh') ||
    url.includes('/auth/email-verification') ||
    url.includes('/auth/forgot-password')
  )
}

const refreshSession = async () => {
  const response = await axios.post<{ data?: { accessToken?: string }; accessToken?: string }>(
    `${API_BASE_URL}/auth/sessions/refresh`,
    null,
    { withCredentials: true }
  )
  const accessToken = response.data.data?.accessToken || response.data.accessToken

  if (!accessToken) {
    throw new Error('Refresh response did not include an access token')
  }

  localStorage.setItem('accessToken', accessToken)
  window.dispatchEvent(new Event('auth-user-updated'))
  return accessToken
}

const getRetryAfterSeconds = (retryAfter?: string) => {
  if (!retryAfter) return null

  const seconds = Number(retryAfter)
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.ceil(seconds)
  }

  const retryDate = new Date(retryAfter)
  if (Number.isNaN(retryDate.getTime())) return null

  const secondsUntilRetry = Math.ceil((retryDate.getTime() - Date.now()) / 1000)
  return secondsUntilRetry > 0 ? secondsUntilRetry : null
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (error.response?.status === 429) {
      const retryAfter = error.response.headers?.['retry-after']
      const retryAfterValue = Array.isArray(retryAfter) ? retryAfter[0] : retryAfter
      const retryAfterSeconds = getRetryAfterSeconds(retryAfterValue)

      toast.error(
        retryAfterSeconds
          ? `Vui lòng đợi ${retryAfterSeconds} giây trước khi thử lại.`
          : 'Bạn đang thao tác quá nhanh. Vui lòng đợi một chút rồi thử lại.'
      )
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !shouldSkipRefresh(originalRequest)) {
      originalRequest._retry = true

      try {
        refreshSessionRequest = refreshSessionRequest || refreshSession()
        const accessToken = await refreshSessionRequest
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        clearStoredAuthSession()
        return Promise.reject(refreshError)
      } finally {
        refreshSessionRequest = null
      }
    }

    // Auto-retry for idempotent requests on network errors, timeouts, and server starting errors (502, 503, 504)
    const method = originalRequest?.method?.toLowerCase()
    const isIdempotentMethod = method === 'get' || method === 'head'
    const status = error.response?.status
    const isNetworkOrServerError =
      !error.response ||
      error.code === 'ECONNABORTED' ||
      (status !== undefined && [502, 503, 504].includes(status))

    const maxRetries = 3
    const currentRetry = originalRequest?._retryCount || 0

    if (originalRequest && !originalRequest._skipRetry && isIdempotentMethod && isNetworkOrServerError && currentRetry < maxRetries) {
      originalRequest._retryCount = currentRetry + 1
      const backoffDelay = 1000 * Math.pow(1.5, currentRetry)
      await new Promise((resolve) => setTimeout(resolve, backoffDelay))
      return api(originalRequest)
    }

    return Promise.reject(error)
  }
)

export default api
