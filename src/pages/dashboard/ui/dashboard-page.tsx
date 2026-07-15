import { Card, CardContent } from '@heroui/react'
import { Link } from 'react-router-dom'
import { useProfileCardsControllerGetProfileCards } from '../../../shared/api/endpoints/profile-cards/profile-cards'
import { useSkillsControllerFindAll } from '../../../shared/api/endpoints/skills/skills'
import { useInterestsControllerFindAll } from '../../../shared/api/endpoints/interests/interests'
import { useJobTypeControllerFindAll } from '../../../shared/api/endpoints/job-type/job-type'
import { useSkillCategoriesControllerFindAll } from '../../../shared/api/endpoints/skill-categories/skill-categories'
import { PageHeader } from '../../../shared/ui'
import { ROUTES } from '../../../shared/config'

export function DashboardPage() {
  // total 만 필요하므로 limit=1 로 가볍게 조회한다.
  const profileCards = useProfileCardsControllerGetProfileCards({ limit: 1 })
  const skills = useSkillsControllerFindAll({ limit: 1 })
  const interests = useInterestsControllerFindAll({ limit: 1 })
  const jobTypes = useJobTypeControllerFindAll({ limit: 1 })
  const skillCategories = useSkillCategoriesControllerFindAll()

  const stats = [
    {
      label: '프로필 카드',
      to: ROUTES.profileCards,
      value: profileCards.data?.data.metadata?.total,
      isLoading: profileCards.isLoading,
    },
    {
      label: '스킬',
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
      label: '관심사',
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
      <PageHeader
        title="대시보드"
        description="서비스 주요 데이터 현황입니다."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to}>
            <Card className="transition-colors hover:border-primary">
              <CardContent className="flex flex-col gap-1 py-5">
                <span className="text-sm text-muted">{stat.label}</span>
                <span className="text-3xl font-semibold text-foreground">
                  {stat.isLoading
                    ? '…'
                    : (stat.value?.toLocaleString() ?? '-')}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
