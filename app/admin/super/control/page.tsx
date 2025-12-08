'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminControlPanel from '@/components/admin-control-panel'

// List of authorized admin emails
const ADMIN_EMAILS = [
  'nir.ram77@gmail.com',
  'nirra007@gmail.com',
]

export default function AdminControlPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { auth } = await import('@/lib/firebase')
        const { onAuthStateChanged } = await import('firebase/auth')
        
        onAuthStateChanged(auth, (user) => {
          if (user && ADMIN_EMAILS.includes(user.email || '')) {
            setAuthorized(true)
          } else {
            router.push('/admin/login')
          }
          setLoading(false)
        })
      } catch (error) {
        console.error('Auth error:', error)
        router.push('/admin/login')
      }
    }
    
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return <AdminControlPanel />
}
