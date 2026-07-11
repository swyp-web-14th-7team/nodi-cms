import { RouterProvider } from 'react-router-dom'
import { QueryProvider } from './providers/query-provider'
import { router } from './router/router'

/** 앱 루트: 전역 프로바이더로 감싼 라우터. */
export function App() {
  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  )
}
