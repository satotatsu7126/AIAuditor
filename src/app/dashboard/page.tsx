'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import {
  CATEGORY_CONFIG,
  STATUS_LABELS,
  type AuditRequest,
  type UserProfile,
  type RequestCategory,
} from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [requests, setRequests] = useState<AuditRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/login')
        return
      }

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      setUser(profile)

      // Fetch user's requests
      const { data: userRequests } = await supabase
        .from('audit_requests')
        .select('*')
        .eq('client_id', authUser.id)
        .order('created_at', { ascending: false })

      setRequests(userRequests || [])
      setLoading(false)
    }

    fetchData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">マイページ</h1>
            <Link
              href="/request"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              新規依頼を作成
            </Link>
          </div>

          {/* User Info */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-lg font-semibold mb-4">アカウント情報</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">表示名:</span>
                <span className="ml-2">{user?.display_name || '未設定'}</span>
              </div>
              <div>
                <span className="text-gray-500">メール:</span>
                <span className="ml-2">{user?.email}</span>
              </div>
              <div>
                <span className="text-gray-500">ロール:</span>
                <span className="ml-2 capitalize">{user?.role}</span>
              </div>
              {user?.role === 'reviewer' && (
                <div>
                  <span className="text-gray-500">専門家承認:</span>
                  <span className={`ml-2 ${user?.is_reviewer_approved ? 'text-green-600' : 'text-yellow-600'}`}>
                    {user?.is_reviewer_approved ? '承認済み' : '申請中'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Requests List */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">依頼一覧</h2>

            {requests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">依頼がありません</p>
                <Link
                  href="/request"
                  className="text-primary-600 hover:underline"
                >
                  新しい依頼を作成する
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => {
                  const statusLabel = STATUS_LABELS[request.status]
                  const categoryLabel = CATEGORY_CONFIG[request.category as RequestCategory]?.label

                  return (
                    <Link
                      key={request.id}
                      href={`/dashboard/requests/${request.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{request.title}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabel.color}`}
                        >
                          {statusLabel.label}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>{categoryLabel}</span>
                        <span>¥{request.budget.toLocaleString()}</span>
                        <span>
                          {new Date(request.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
