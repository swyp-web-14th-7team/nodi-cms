import type { ReactNode } from 'react'
import { Card, CardContent } from '@heroui/react'
import { Link } from 'react-router-dom'
import { useSkillsControllerFindAll } from '../../../shared/api/endpoints/skills/skills'
import { useInterestsControllerFindAll } from '../../../shared/api/endpoints/interests/interests'
import { useJobTypeControllerFindAll } from '../../../shared/api/endpoints/job-type/job-type'
import { useSkillCategoriesControllerFindAll } from '../../../shared/api/endpoints/skill-categories/skill-categories'
import type { FormattedDate, UserResponse } from '../../../shared/api/model'
import { useAllUsers, MAX_USERS } from '../../../entities/user'
import { UserRole } from '../../../entities/session'
import { PageHeader } from '../../../shared/ui'
import { ROUTES } from '../../../shared/config'

const DAY_MS = 24 * 60 * 60 * 1000
const RECENT_DAYS = 7

/** 지금으로부터 days 일 이내인지. 값이 없으면 false. */
const isWithinDays = (date: FormattedDate | null | undefined, days: number) =>
  !!date && Date.now() - date.timestamp <= days * DAY_MS

const countBy = (users: UserResponse[], predicate: (u: UserResponse) => boolean) =>
  users.filter(predicate).length

export function DashboardPage() {
  // total 만 필요하므로 limit=1 로 가볍게 조회한다.
  const skills = useSkillsControllerFindAll({ limit: 1 })
  const interests = useInterestsControllerFindAll({ limit: 1 })
  const jobTypes = useJobTypeControllerFindAll({ limit: 1 })
  const skillCategories = useSkillCategoriesControllerFindAll()

  // 유저 지표는 가입일·최종 로그인·탈퇴 여부를 세어야 해서 목록을 통째로 받는다.
  // 유저 관리 화면과 같은 쿼리라 캐시를 공유한다.
  const users = useAllUsers()

  const withdrawn = countBy(users.users, (u) => !!u.deletedAt)
  const active = users.users.length - withdrawn
  const newcomers = countBy(users.users, (u) =>
    isWithinDays(u.createdAt, RECENT_DAYS),
  )
  // 탈퇴자는 빼고 센다. 탈퇴 직전 로그인이 활동으로 잡히면 안 된다.
  const recentlyActive = countBy(
    users.users,
    (u) => !u.deletedAt && isWithinDays(u.lastLoginAt, RECENT_DAYS),
  )
  const admins = countBy(users.users, (u) => u.role === UserRole.ADMIN)

  const withdrawnRate =
    users.users.length > 0
      ? `전체 ${users.users.length.toLocaleString()}명 중 ${Math.round(
          (withdrawn / users.users.length) * 100,
        )}%`
      : undefined

  const userStats = [
    {
      label: '활성 유저',
      value: active,
      hint: withdrawn > 0 ? `탈퇴 ${withdrawn.toLocaleString()}명 제외` : undefined,
    },
    {
      label: `신규 가입 (${RECENT_DAYS}일)`,
      value: newcomers,
      hint: '최근 가입한 유저',
    },
    {
      label: `최근 ${RECENT_DAYS}일 로그인`,
      value: recentlyActive,
      hint:
        active > 0
          ? `활성 유저의 ${Math.round((recentlyActive / active) * 100)}%`
          : undefined,
    },
    { label: '탈퇴 유저', value: withdrawn, hint: withdrawnRate },
    { label: '관리자', value: admins, hint: 'ADMIN 권한' },
  ]

  const contentStats = [
    {
      label: '스킬 태그',
      to: ROUTES.skills,
      value: skills.data?.data.metadata?.total,
      isLoading: skills.isLoading,
    },
    {
      label: '스킬 카테고리',
      to: ROUTES.skills,
      value: skillCategories.data?.data.length,
      isLoading: skillCategories.isLoading,
    },
    {
      label: '관심분야 태그',
      to: ROUTES.interests,
      value: interests.data?.data.metadata?.total,
      isLoading: interests.isLoading,
    },
    {
      label: '직무',
      to: ROUTES.jobTypes,
      value: jobTypes.data?.data.metadata?.total,
      isLoading: jobTypes.isLoading,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="대시보드" description="서비스 주요 데이터 현황입니다." />

      <SectionTitle>유저</SectionTitle>

      {users.isError ? (
        <p className="text-sm text-muted">유저 지표를 불러오지 못했습니다.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {userStats.map((stat) => (
              <Link key={stat.label} to={ROUTES.users}>
                <StatCard
                  label={stat.label}
                  value={stat.value}
                  hint={stat.hint}
                  isLoading={users.isLoading}
                />
              </Link>
            ))}
          </div>
          {users.isTruncated && (
            <p className="text-sm text-muted">
              유저가 {users.totalCount.toLocaleString()}명이라 최근{' '}
              {MAX_USERS.toLocaleString()}명 기준으로 집계했습니다.
            </p>
          )}
        </>
      )}

      <SectionTitle>콘텐츠</SectionTitle>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {contentStats.map((stat) => (
          <Link key={stat.label} to={stat.to}>
            <StatCard
              label={stat.label}
              value={stat.value}
              isLoading={stat.isLoading}
            />
          </Link>
        ))}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-2 text-sm font-medium text-muted first-of-type:mt-0">
      {children}
    </h2>
  )
}

function StatCard({
  label,
  value,
  hint,
  isLoading,
}: {
  label: string
  value?: number
  hint?: string
  isLoading?: boolean
}) {
  return (
    <Card className="h-full transition-colors hover:border-accent">
      <CardContent className="flex flex-col gap-1 py-5">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-3xl font-semibold text-foreground">
          {isLoading ? '…' : (value?.toLocaleString() ?? '-')}
        </span>
        {/* 카드 높이는 grid 가 한 줄씩 맞춰주므로 힌트 없는 카드는 줄을 비워두지 않는다. */}
        {!isLoading && hint && (
          <span className="text-xs text-muted">{hint}</span>
        )}
      </CardContent>
    </Card>
  )
}
