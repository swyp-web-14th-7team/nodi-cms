import { useState } from 'react'
import type { FormattedDate, UserResponse } from '../../../shared/api/model'
import { useAllUsers, MAX_USERS } from '../../../entities/user'
import {
  PageHeader,
  DataTable,
  PaginationBar,
  FilterPill,
  type Column,
} from '../../../shared/ui'

const LIMIT = 20

type UserFilter = 'active' | 'withdrawn' | 'all'

const FILTERS: { key: UserFilter; label: string }[] = [
  { key: 'active', label: '활성' },
  { key: 'withdrawn', label: '탈퇴' },
  { key: 'all', label: '전체' },
]

// FormattedDate 를 "YYYY. MM. DD." 형태로. null 이면 대시.
const formatDate = (fd?: FormattedDate | null) =>
  fd ? new Date(fd.timestamp).toLocaleDateString('ko-KR') : '—'

// 상태/권한 뱃지. 활성/탈퇴, 일반/ADMIN 을 색으로 구분한다.
// 이 CMS 는 --accent 를 회색(surface-secondary)으로 덮어써서 accent 계열은
// 배경과 대비가 안 난다. 라이트/다크 양쪽에서 또렷하도록 채도 있는 단색 + 흰 글씨를 쓴다.
function Badge({
  children,
  tone,
}: {
  children: string
  tone: 'neutral' | 'admin' | 'active' | 'withdrawn'
}) {
  const cls = {
    neutral: 'bg-surface-secondary text-foreground/70',
    admin: 'bg-indigo-500 text-white',
    active: 'bg-emerald-500 text-white',
    withdrawn: 'bg-red-500 text-white',
  }[tone]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {children}
    </span>
  )
}

const columns: Column<UserResponse>[] = [
  {
    key: 'name',
    header: '이름',
    render: (u) => <span className="text-foreground">{u.name}</span>,
  },
  {
    key: 'nickname',
    header: '닉네임',
    render: (u) => <span className="text-foreground/70">{u.nickname}</span>,
  },
  {
    key: 'email',
    header: '이메일',
    render: (u) => <span className="text-foreground/70">{u.email}</span>,
  },
  {
    key: 'role',
    header: '권한',
    className: 'w-24',
    render: (u) =>
      u.role === 1 ? (
        <Badge tone="admin">ADMIN</Badge>
      ) : (
        <Badge tone="neutral">일반</Badge>
      ),
  },
  {
    key: 'createdAt',
    header: '가입일',
    className: 'w-28 whitespace-nowrap',
    render: (u) => (
      <span className="text-foreground/70">{formatDate(u.createdAt)}</span>
    ),
  },
  {
    key: 'lastLoginAt',
    header: '마지막 로그인',
    className: 'w-32 whitespace-nowrap',
    render: (u) => (
      <span className="text-foreground/70">
        {u.lastLoginAt ? u.lastLoginAt.timeAgo : '—'}
      </span>
    ),
  },
  {
    key: 'status',
    header: '상태',
    className: 'w-32',
    render: (u) =>
      u.deletedAt ? (
        <div className="flex flex-col items-start gap-0.5">
          <Badge tone="withdrawn">탈퇴</Badge>
          <span className="text-xs text-muted">{formatDate(u.deletedAt)}</span>
        </div>
      ) : (
        <Badge tone="active">활성</Badge>
      ),
  },
]

const matchesFilter = (user: UserResponse, filter: UserFilter) => {
  if (filter === 'all') return true
  return filter === 'withdrawn' ? !!user.deletedAt : !user.deletedAt
}

export function UsersPage() {
  const [filter, setFilter] = useState<UserFilter>('active')
  const [page, setPage] = useState(1)

  const {
    users: allUsers,
    totalCount,
    isLoading,
    isError,
    isTruncated,
  } = useAllUsers()

  const withdrawnCount = allUsers.filter((u) => u.deletedAt).length
  const counts: Record<UserFilter, number> = {
    active: allUsers.length - withdrawnCount,
    withdrawn: withdrawnCount,
    all: allUsers.length,
  }

  const filtered = allUsers.filter((u) => matchesFilter(u, filter))
  const pageItems = filtered.slice((page - 1) * LIMIT, page * LIMIT)

  const selectFilter = (next: UserFilter) => {
    setFilter(next)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="유저 관리"
        description="서비스에 가입한 유저를 조회합니다. 기본은 탈퇴하지 않은 유저만 보여줍니다."
      />

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <FilterPill
            key={f.key}
            active={filter === f.key}
            onClick={() => selectFilter(f.key)}
          >
            {`${f.label} ${counts[f.key]}`}
          </FilterPill>
        ))}
      </div>

      {isTruncated && (
        <p className="text-sm text-muted">
          유저가 {totalCount.toLocaleString()}명이라 최근{' '}
          {MAX_USERS.toLocaleString()}명까지만 불러왔습니다.
        </p>
      )}

      <DataTable
        columns={columns}
        items={pageItems}
        rowKey={(u) => u.id}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={
          filter === 'withdrawn'
            ? '탈퇴한 유저가 없습니다.'
            : '가입한 유저가 없습니다.'
        }
      />

      {filtered.length > 0 && (
        <PaginationBar
          page={page}
          total={filtered.length}
          limit={LIMIT}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
