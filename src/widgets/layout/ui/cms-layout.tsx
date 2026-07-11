import { Outlet } from 'react-router-dom'
import { Sidebar } from '../../sidebar'
import { Header } from '../../header'

/**
 * CMS 공통 레이아웃: 좌측 사이드바 + 상단 헤더 + 본문(Outlet).
 * 라우터에서 이 레이아웃 아래에 각 페이지를 중첩시킨다.
 */
export function CmsLayout() {
  return (
    <div className="min-h-svh flex bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
