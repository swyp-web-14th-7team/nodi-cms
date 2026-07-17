import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../../sidebar'
import { Header } from '../../header'
import { useMediaQuery } from '../../../shared/lib'

/** 이 아래로는 사이드바를 자동으로 접는다(= Tailwind lg 미만). */
const NARROW_QUERY = '(max-width: 1023px)'

/**
 * CMS 공통 레이아웃: 상단 로고 바 + (좌측 사이드바 · 본문).
 * 라우터에서 이 레이아웃 아래에 각 페이지를 중첩시킨다.
 *
 * 높이를 뷰포트에 고정(h-svh)해 헤더·사이드바는 스크롤에 흔들리지 않고,
 * 스크롤은 본문(main)에서만 일어난다.
 *
 * 사이드바는 화면 폭에 따라 성격이 바뀐다.
 * - 넓은 화면: 본문을 옆으로 밀어내는 고정 컬럼. 헤더 버튼으로 접었다 펼 수 있다.
 * - 좁은 화면: 기본으로 접히고, 열면 본문 위에 덮이는 서랍이 된다(폭이 모자란데
 *   밀어내면 본문이 짜부라지기 때문). 항목을 고르면 다시 접힌다.
 */
export function CmsLayout() {
  const isNarrow = useMediaQuery(NARROW_QUERY)
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isNarrow)

  // 폭이 경계를 넘나들면 그 폭의 기본값으로 되돌린다(좁아지면 접고, 넓어지면 편다).
  // 이펙트가 아니라 렌더 중에 맞춘다 — 리액트가 권하는 방식이고, 이펙트로 하면
  // 한 번 그린 뒤 고치는 꼴이라 사이드바가 번쩍인다.
  const [wasNarrow, setWasNarrow] = useState(isNarrow)
  if (wasNarrow !== isNarrow) {
    setWasNarrow(isNarrow)
    setIsSidebarOpen(!isNarrow)
  }

  // 서랍으로 떠 있을 때만 항목 선택 후 접는다. 넓은 화면에선 열어둔 채 유지한다.
  const closeIfNarrow = () => {
    if (isNarrow) setIsSidebarOpen(false)
  }

  // 서랍으로 떠 있으면 Escape 로도 닫는다.
  useEffect(() => {
    if (!isNarrow || !isSidebarOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isNarrow, isSidebarOpen])

  return (
    <div className="h-svh flex flex-col overflow-hidden bg-background text-foreground">
      <Header
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
      />
      <div className="relative flex flex-1 min-h-0">
        {isSidebarOpen && (
          <Sidebar isOverlay={isNarrow} onNavigate={closeIfNarrow} />
        )}
        {isNarrow && isSidebarOpen && (
          <div
            className="absolute inset-0 z-30 bg-black/40"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden
          />
        )}
        <main className="flex-1 overflow-y-auto px-8 py-7 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
