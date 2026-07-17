import { ThemeToggle } from '../../../features/theme'
import { MeMenu } from '../../../features/me'

export function Header({
  isSidebarOpen,
  onToggleSidebar,
}: {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}) {
  return (
    <header className="h-16 shrink-0 border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-3 text-foreground">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? '메뉴 접기' : '메뉴 펼치기'}
          aria-expanded={isSidebarOpen}
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
        >
          <SidebarIcon />
        </button>
        <div className="flex items-center gap-2">
          <NodiMark />
          <span className="text-xl font-bold tracking-tight">NODI</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <MeMenu />
      </div>
    </header>
  )
}

/** 사이드바 토글 글리프. 왼쪽 기둥이 있는 패널 = 좌측 네비를 뜻한다. */
function SidebarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="4.5"
        width="18"
        height="15"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M9.5 4.5v15" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

/** NODI 워드마크 옆 노드/그래프 글리프. */
function NodiMark() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden
      className="text-foreground"
    >
      <path
        d="M4 18C8 18 9 8 14 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="4" cy="18" r="2.6" fill="currentColor" />
      <circle cx="20" cy="8" r="2.6" fill="currentColor" />
      <path
        d="M14 8H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
