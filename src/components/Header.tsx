'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types'

export default function Header() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        setUser(profile)
      }
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setUser(profile)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary-600">
              AI Auditor
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
            ) : user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    管理画面
                  </Link>
                )}
                {user.role === 'reviewer' && user.is_reviewer_approved && (
                  <Link
                    href="/reviewer"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    専門家ダッシュボード
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  マイページ
                </Link>
                <span className="text-sm text-gray-500">
                  {user.display_name || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                ログイン
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
