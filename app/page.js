'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'

export default function Home() {
  const { user, userRole, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user && userRole === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/products')
      }
    }
  }, [user, userRole, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black"></div>
      </div>
    )
  }

  return null
}
