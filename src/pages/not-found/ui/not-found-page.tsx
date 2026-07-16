import { Link } from 'react-router-dom'
import { PlaceholderPage } from '../../../shared/ui'

export function NotFoundPage() {
  return (
    <PlaceholderPage title="404" description="존재하지 않는 페이지입니다.">
      <Link to="/" className="text-sm text-accent underline">
        대시보드로 돌아가기
      </Link>
    </PlaceholderPage>
  )
}
