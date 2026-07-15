import { ThemeToggle } from '../../../features/theme'

export function Header() {
  return (
    <header className="h-16 shrink-0 border-b border-divider flex items-center justify-between px-6">
      <div className="flex items-center gap-2 text-foreground">
        <NodiMark />
        <span className="text-xl font-bold tracking-tight">NODI</span>
      </div>
      <ThemeToggle />
    </header>
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
