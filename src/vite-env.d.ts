/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 백엔드 API 서버 주소 (.env / .env.deploy) */
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
