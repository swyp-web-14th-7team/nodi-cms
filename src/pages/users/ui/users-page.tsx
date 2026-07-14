import { Card, CardContent, CardHeader } from '@heroui/react'
import { useUsersControllerGetMe } from '../../../shared/api/endpoints/users/users'
import { PageHeader } from '../../../shared/ui'

export function UsersPage() {
  const { data, isLoading, isError } = useUsersControllerGetMe()
  const me = data?.data

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="사용자"
        description="현재 로그인한 관리자 계정 정보입니다. (목록 조회 API 미제공)"
      />

      <Card className="max-w-lg">
        <CardHeader>
          <h2 className="text-base font-medium text-foreground">내 계정</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted">불러오는 중…</p>
          ) : isError || !me ? (
            <p className="text-sm text-muted">
              계정 정보를 불러오지 못했습니다.
            </p>
          ) : (
            <dl className="grid grid-cols-[7rem_1fr] gap-y-3 text-sm">
              <InfoRow label="ID" value={me.id} />
              <InfoRow label="이름" value={me.name} />
              <InfoRow label="닉네임" value={me.nickname} />
              <InfoRow label="이메일" value={me.email} />
              <InfoRow label="가입일" value={me.createdAt.isoString} />
              <InfoRow label="수정일" value={me.updatedAt.isoString} />
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </>
  )
}
