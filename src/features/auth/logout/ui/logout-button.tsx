import { useState } from 'react'
import { Button } from '@heroui/react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../../../entities/session'
import { ROUTES } from '../../../../shared/config'

export function LogoutButton() {
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  const onLogout = async () => {
    setPending(true)
    await logout()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <Button size="sm" variant="ghost" isDisabled={pending} onPress={onLogout}>
      {pending ? '로그아웃 중…' : '로그아웃'}
    </Button>
  )
}
