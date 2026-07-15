import { RouterProvider } from 'react-router-dom'
import { Toast } from '@heroui/react'
import { QueryProvider } from './providers/query-provider'
import { router } from './router/router'

/** 앱 루트: 전역 프로바이더로 감싼 라우터. */
export function App() {
  return (
    <QueryProvider>
      <RouterProvider router={router} />
      {/* 전역 토스트 영역. shared/lib 의 undo 삭제 토스트가 여기로 렌더된다. */}
      <Toast.Provider placement="bottom end" />
    </QueryProvider>
  )
}
