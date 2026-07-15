import { Outlet } from 'react-router-dom'
import { Sidebar } from '../../sidebar'
import { Header } from '../../header'

/**
 * CMS 공통 레이아웃: 상단 로고 바 + (좌측 사이드바 · 본문).
 * 라우터에서 이 레이아웃 아래에 각 페이지를 중첩시킨다.
 *
 * 높이를 뷰포트에 고정(h-svh)해 헤더·사이드바는 스크롤에 흔들리지 않고,
 * 스크롤은 본문(main)에서만 일어난다.
 */
export function CmsLayout() {
  return (
    <div className="h-svh flex flex-col overflow-hidden bg-background text-foreground">
      <Header />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-8 py-7 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
