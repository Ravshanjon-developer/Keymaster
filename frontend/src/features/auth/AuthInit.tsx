import { useEffect } from 'react'

import { useAuthStore } from '@/features/auth/authStore'

export function AuthInit({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((s) => s.initAuth)
  useEffect(() => {
    void initAuth()
  }, [initAuth])
  return children
}
