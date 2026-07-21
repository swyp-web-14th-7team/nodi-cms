import { useState } from 'react'
import { useUsersControllerGetAllUsers } from '../../../shared/api/endpoints/users/users'
import type {
  AdminUserResponse,
  FormattedDate,
  UsersControllerGetAllUsersParams,
} from '../../../shared/api/model'
import { PageHeader, DataTable, PaginationBar, type Column } from '../../../shared/ui'

const LIMIT = 20

// FormattedDate 를 "YYYY. MM. DD." 형태로. null 이면 대시.
const formatDate = (fd: FormattedDate | null) =>
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

const columns: Column<AdminUserResponse>[] = [
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
    className: 'w-24',
    render: (u) =>
      u.deletedAt ? (
        <Badge tone="withdrawn">탈퇴</Badge>
      ) : (
        <Badge tone="active">활성</Badge>
      ),
  },
]

export function UsersPage() {
  const [page, setPage] = useState(1)

  const params: UsersControllerGetAllUsersParams = { page, limit: LIMIT }
  const { data, isLoading, isError } = useUsersControllerGetAllUsers(params)

  const users: AdminUserResponse[] = data?.data.items ?? []
  const total = data?.data.metadata?.total ?? 0

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="유저 관리"
        description="서비스에 가입한 전체 유저를 조회합니다. 탈퇴한 유저도 포함됩니다."
      />

      <DataTable
        columns={columns}
        items={users}
        rowKey={(u) => u.id}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="가입한 유저가 없습니다."
      />

      {total > 0 && (
        <PaginationBar
          page={page}
          total={total}
          limit={LIMIT}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
