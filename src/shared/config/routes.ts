/** 앱 라우트 경로 상수. 라우터 설정과 네비게이션이 이 값을 공유한다. */
export const ROUTES = {
  login: '/login',
  // provider(google/naver/kakao)가 경로에 담긴다. 백엔드 redirect_uri 와 일치해야 함.
  authCallback: '/auth/:provider/callback',
  forbidden: '/forbidden',
  dashboard: '/',
  skills: '/skills',
  interests: '/interests',
  jobTypes: '/job-types',
  personalities: '/personalities',
  purposes: '/purposes',
  affiliationStatuses: '/affiliation-statuses',
} as const
