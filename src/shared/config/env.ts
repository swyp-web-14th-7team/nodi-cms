/** 앱 전역 환경설정. import.meta.env 접근은 이 파일로 일원화한다. */
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (!apiBaseUrl) {
  throw new Error(
    'VITE_API_BASE_URL 이 설정되지 않았습니다. 프로젝트 루트 .env 를 확인하세요 (.env.example 참고).',
  )
}

export const env = {
  apiBaseUrl,
} as const
