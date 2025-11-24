import { ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useLocation } from 'wouter'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const [location, setLocation] = useLocation()

  useEffect(() => {
    console.log('ProtectedRoute - location:', location, 'isLoading:', isLoading, 'isAuthenticated:', isAuthenticated)

    // Hanya redirect jika bukan di halaman login dan tidak terautentikasi
    if (!isLoading && !isAuthenticated && location !== '/login') {
      console.log('Redirecting to login...')
      setLocation('/login')
    }
  }, [isAuthenticated, isLoading, location, setLocation])

  if (isLoading) {
    console.log('ProtectedRoute - showing loading')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute - not authenticated, returning null')
    return null
  }

  console.log('ProtectedRoute - authenticated, rendering children')
  return <>{children}</>
}