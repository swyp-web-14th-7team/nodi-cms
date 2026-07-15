import { createBrowserRouter } from 'react-router-dom'
import { CmsLayout } from '../../widgets/layout'
import { ROUTES } from '../../shared/config'
import { ProtectedRoute } from './protected-route'
import { DashboardPage } from '../../pages/dashboard'
import { ProfileCardsPage } from '../../pages/profile-cards'
import { SkillsPage } from '../../pages/skills'
import { InterestsPage } from '../../pages/interests'
import { JobTypesPage } from '../../pages/job-types'
import { PersonalitiesPage } from '../../pages/personalities'
import { PurposesPage } from '../../pages/purposes'
import { AffiliationStatusesPage } from '../../pages/affiliation-statuses'
import { UsersPage } from '../../pages/users'
import { NotFoundPage } from '../../pages/not-found'
import { LoginPage } from '../../pages/login'
import { AuthCallbackPage } from '../../pages/auth-callback'
import { ForbiddenPage } from '../../pages/forbidden'

/**
 * 앱 라우터.
 * - 공개: /login, /auth/callback, /forbidden
 * - 보호: ProtectedRoute(ADMIN 게이팅) > CmsLayout > 각 도메인 페이지
 */
export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <CmsLayout />,
        children: [
          { path: ROUTES.dashboard, element: <DashboardPage /> },
          { path: ROUTES.profileCards, element: <ProfileCardsPage /> },
          { path: ROUTES.skills, element: <SkillsPage /> },
          { path: ROUTES.interests, element: <InterestsPage /> },
          { path: ROUTES.jobTypes, element: <JobTypesPage /> },
          { path: ROUTES.personalities, element: <PersonalitiesPage /> },
          { path: ROUTES.purposes, element: <PurposesPage /> },
          {
            path: ROUTES.affiliationStatuses,
            element: <AffiliationStatusesPage />,
          },
          { path: ROUTES.users, element: <UsersPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
  { path: ROUTES.login, element: <LoginPage /> },
  { path: ROUTES.authCallback, element: <AuthCallbackPage /> },
  { path: ROUTES.forbidden, element: <ForbiddenPage /> },
])
