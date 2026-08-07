import { Navigate, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/authStore'

export function ProtectedRoute({
  children,
  redirect = 'register',
}: {
  children: React.ReactNode
  /** Куда отправить гостя: регистрация — основной сценарий для практики */
  redirect?: 'login' | 'register'
}) {
  const token = useAuthStore((s) => s.token)
  const location = useLocation()
  if (!token) {
    const to = redirect === 'register' ? '/register' : '/login'
    return <Navigate to={to} replace state={{ from: location.pathname + location.search }} />
  }
  return children
}
