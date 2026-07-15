import { ROUTES } from '../../../shared/config'

export interface NavItem {
  label: string
  to: string
}

/** 사이드바 네비게이션 항목. API 도메인(태그) 기준으로 구성한다. */
export const NAV_ITEMS: NavItem[] = [
  { label: '대시보드', to: ROUTES.dashboard },
  { label: '프로필 카드', to: ROUTES.profileCards },
  { label: '스킬', to: ROUTES.skills },
  { label: '관심사', to: ROUTES.interests },
  { label: '직무', to: ROUTES.jobTypes },
  { label: '성향', to: ROUTES.personalities },
  { label: '목적', to: ROUTES.purposes },
  { label: '소속 상태', to: ROUTES.affiliationStatuses },
  { label: '템플릿', to: ROUTES.templates },
  { label: '사용자', to: ROUTES.users },
]
