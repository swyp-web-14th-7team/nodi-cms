import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { NAV_ITEMS } from '../model/nav-items'
import { logout } from '../../../entities/session'
import { ROUTES } from '../../../shared/config'

/**
 * 좌측 네비게이션. 펼쳐져 있을 때만 렌더된다(여닫는 판단은 CmsLayout 이 한다).
 *
 * isOverlay 면 본문을 밀어내는 대신 그 위에 덮는 서랍이 된다. 좁은 화면에서
 * 256px 를 밀어내면 본문이 짜부라지기 때문이다.
 */
export function Sidebar({
  isOverlay = false,
  onNavigate,
}: {
  isOverlay?: boolean
  /** 네비 항목을 눌렀을 때. 서랍 모드면 여기서 접는다. */
  onNavigate?: () => void
}) {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const onLogout = async () => {
    setLoggingOut(true)
    await logout()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <aside
      className={[
        'w-64 border-r border-border flex flex-col',
        isOverlay
          ? 'absolute inset-y-0 left-0 z-40 bg-background shadow-xl'
          : 'shrink-0',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 px-5 py-5 text-foreground">
        <GearIcon />
        <span className="text-base font-semibold">관리자 페이지</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  [
                    'block rounded-lg px-4 py-2.5 text-[15px] transition-colors',
                    isActive
                      ? 'bg-surface-secondary font-semibold text-foreground'
                      : 'text-muted hover:bg-surface-secondary/50 hover:text-foreground',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-3 py-4">
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="w-full rounded-lg px-4 py-2.5 text-left text-[15px] text-muted transition-colors hover:bg-surface-secondary/50 hover:text-foreground disabled:opacity-60"
        >
          {loggingOut ? '로그아웃 중…' : '로그아웃'}
        </button>
      </div>
    </aside>
  )
}

function GearIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="text-foreground"
    >
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4L5.3 5.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
