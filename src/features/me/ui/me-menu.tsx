import { Popover } from '@heroui/react'
import type { ReactNode } from 'react'
import { useUsersControllerGetMe } from '../../../shared/api/endpoints/users/users'
import { useAuthStore, UserRole } from '../../../entities/session'

/**
 * 헤더 우측의 내 정보. 평소엔 닉네임만 짧게 보이고, 누르면 상세가 펼쳐진다.
 *
 * CmsLayout 은 ProtectedRoute(ADMIN) 안에서만 그려지므로 /users/me 는 조건 없이 호출한다.
 */
export function MeMenu() {
  const { data, isLoading, isError } = useUsersControllerGetMe()
  const role = useAuthStore((s) => s.role)
  const me = data?.data

  // 닉네임이 비어 있는 계정도 있어 이름으로 흘린다.
  const displayName = me?.nickname?.trim() || me?.name?.trim() || ''
  const label = isLoading ? '…' : displayName || '내 정보'

  return (
    <Popover.Root>
      {/*
        Popover.Trigger 는 이미 role="button" 인 div 를 그린다.
        안에 <button> 을 또 넣으면 버튼 속 버튼이 되므로 트리거 자체를 꾸민다.
        (cursor 는 .popover__trigger 가 이미 지정한다. flex 는 utilities 레이어라
         .popover__trigger 의 inline-block 을 덮는다.)
      */}
      <Popover.Trigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:bg-surface-secondary hover:text-foreground">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-xs font-semibold text-foreground">
          {displayName ? displayName.charAt(0) : '?'}
        </span>
        <span className="max-w-32 truncate">{label}</span>
      </Popover.Trigger>

      <Popover.Content placement="bottom end">
        <Popover.Dialog className="w-64 p-4">
          {isError ? (
            <p className="text-sm text-danger">
              내 정보를 불러오지 못했습니다.
            </p>
          ) : isLoading || !me ? (
            <p className="text-sm text-muted">불러오는 중…</p>
          ) : (
            <dl className="flex flex-col gap-2.5">
              <Row label="이름">{me.name}</Row>
              <Row label="닉네임">{me.nickname || '-'}</Row>
              <Row label="이메일">{me.email}</Row>
              <Row label="역할">
                {role === UserRole.ADMIN ? '관리자' : '일반'}
              </Row>
            </dl>
          )}
        </Popover.Dialog>
      </Popover.Content>
    </Popover.Root>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-xs text-muted">{label}</dt>
      <dd className="truncate text-sm text-foreground">{children}</dd>
    </div>
  )
}
