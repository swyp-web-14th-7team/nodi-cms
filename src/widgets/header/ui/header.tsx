import { LogoutButton } from '../../../features/auth'

export function Header() {
  return (
    <header className="h-14 shrink-0 border-b border-divider bg-content1 flex items-center justify-between px-6">
      <div className="text-sm text-muted">프로필 카드 공유 서비스 · 관리자</div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">관리자</span>
        <LogoutButton />
      </div>
    </header>
  )
}
