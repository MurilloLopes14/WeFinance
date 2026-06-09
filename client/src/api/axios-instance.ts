import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { clearAccessToken, getAccessToken } from './auth-storage'

const DEFAULT_API_BASE_URL = 'http://localhost:2950/api/v1'

export const axiosInstance = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
})

/** Called from main.tsx — keeps import.meta out of this file (Orval bundles it). */
export function configureAxiosBaseUrl(baseUrl?: string) {
  const normalized = baseUrl?.replace(/\/$/, '')
  axiosInstance.defaults.baseURL = normalized || DEFAULT_API_BASE_URL
}

export function getApiBaseUrl(): string {
  return axiosInstance.defaults.baseURL ?? DEFAULT_API_BASE_URL
}

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearAccessToken()
      window.dispatchEvent(new CustomEvent('wefinance:unauthorized'))
    }

    return Promise.reject(error)
  },
)

export type BodyType<BodyData> = BodyData

export type ErrorType<Error> = AxiosError<Error>

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  return axiosInstance({ ...config, ...options }).then(({ data }) => data as T)
}

export default customInstance
