import Axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { env } from '../config'

/**
 * orval 의 `override.mutator` 가 가리키는 커스텀 axios 인스턴스 (shared 레이어).
 *
 * 토큰 전략:
 * - accessToken: 메모리(session 엔티티의 스토어)에 보관 → 요청 시 Authorization 헤더로 첨부.
 * - refreshToken: 서버가 httpOnly 쿠키로 관리 → `withCredentials: true` 로 자동 송수신.
 *
 * ⚠️ FSD 규칙상 shared 는 상위 레이어(entities/session)를 import 할 수 없다.
 * 그래서 토큰 접근을 "주입"으로 처리한다. session 엔티티가 앱 시작 시
 * `registerAuthTokenAccessor()` 로 실제 스토어 getter/setter 를 꽂아준다.
 */
export interface AuthTokenAccessor {
  getToken: () => string | null
  setToken: (token: string) => void
  clearToken: () => void
}

// 기본값: 아직 세션이 주입되지 않은 상태(비로그인). shared 는 이 이상을 모른다.
let tokenAccessor: AuthTokenAccessor = {
  getToken: () => null,
  setToken: () => {},
  clearToken: () => {},
}

export const registerAuthTokenAccessor = (accessor: AuthTokenAccessor) => {
  tokenAccessor = accessor
}

export const AXIOS_INSTANCE = Axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true, // refreshToken 쿠키를 요청마다 함께 보냄
})

// refresh 엔드포인트 자체에는 재시도/토큰첨부 로직을 태우지 않는다(무한루프 방지).
const REFRESH_URL = '/auth/refresh'

// ── 요청 인터셉터: 메모리의 accessToken 을 Authorization 헤더로 첨부 ──
AXIOS_INSTANCE.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenAccessor.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── 응답 인터셉터: 401 → refresh → 원요청 재시도 (single-flight) ──
let refreshPromise: Promise<string> | null = null

const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = AXIOS_INSTANCE.post<{ data: { accessToken: string } }>(
      REFRESH_URL,
    )
      .then(({ data }) => {
        const newToken = data.data.accessToken
        tokenAccessor.setToken(newToken)
        return newToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined

    const isAuthError = error.response?.status === 401
    const isRefreshCall = original?.url?.includes(REFRESH_URL)

    if (isAuthError && original && !original._retried && !isRefreshCall) {
      original._retried = true
      try {
        const newToken = await refreshAccessToken()
        original.headers.Authorization = `Bearer ${newToken}`
        return AXIOS_INSTANCE(original)
      } catch (refreshError) {
        tokenAccessor.clearToken()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = Axios.CancelToken.source()
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data)

  // @ts-expect-error orval 가 반환 promise 에 cancel 을 붙이는 관례
  promise.cancel = () => {
    source.cancel('Query was cancelled')
  }

  return promise
}

export type ErrorType<Error> = AxiosError<Error>
export type BodyType<BodyData> = BodyData
