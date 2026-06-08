import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { clearAccessToken, getAccessToken } from './auth-storage'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
})

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
