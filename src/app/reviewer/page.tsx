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

export default function ReviewerDashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [openRequests, setOpenRequests] = useState<AuditRequest[]>([])
  const [myRequests, setMyRequests] = useState<AuditRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)

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

      if (!profile || profile.role !== 'reviewer' || !profile.is_reviewer_approved) {
        router.push('/dashboard')
        return
      }

      setUser(profile)

      // Fetch open requests
      const { data: open } = await supabase
        .from('audit_requests')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      setOpenRequests(open || [])

      // Fetch reviewer's assigned requests
      const { data: assigned } = await supabase
        .from('audit_requests')
        .select('*')
        .eq('reviewer_id', authUser.id)
        .in('status', ['in_progress', 'completed'])
        .order('created_at', { ascending: false })

      setMyRequests(assigned || [])
      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleClaim = async (requestId: string) => {
    if (!user) return

    setClaiming(requestId)

    try {
      const { error } = await supabase
        .from('audit_requests')
        .update({
          reviewer_id: user.id,
          status: 'in_progress',
          claimed_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('status', 'open') // Ensure it's still open (排他制御)

      if (error) throw error

      // Move request from open to my requests
      const claimedRequest = openRequests.find((r) => r.id === requestId)
      if (claimedRequest) {
        setOpenRequests(openRequests.filter((r) => r.id !== requestId))
        setMyRequests([
          { ...claimedRequest, status: 'in_progress', reviewer_id: user.id },
          ...myRequests,
        ])
      }
    } catch (error) {
      alert('案件の取得に失敗しました。既に他の専門家が担当している可能性があります。')
    }

    setClaiming(null)
  }

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
          <h1 className="text-3xl font-bold mb-8">専門家ダッシュボード</h1>

          {/* My Requests */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-lg font-semibold mb-4">担当中の案件</h2>

            {myRequests.filter((r) => r.status === 'in_progress').length === 0 ? (
              <p className="text-gray-500 text-center py-8">担当中の案件はありません</p>
            ) : (
              <div className="space-y-4">
                {myRequests
                  .filter((r) => r.status === 'in_progress')
                  .map((request) => {
                    const categoryLabel = CATEGORY_CONFIG[request.category as RequestCategory]?.label

                    return (
                      <Link
                        key={request.id}
                        href={`/reviewer/work/${request.id}`}
                        className="block p-4 border border-yellow-200 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{request.title}</h3>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            作業中
                          </span>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>{categoryLabel}</span>
                          <span>¥{request.budget.toLocaleString()}</span>
                        </div>
                      </Link>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Open Requests Pool */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-lg font-semibold mb-4">対応可能な案件</h2>

            {openRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">現在対応可能な案件はありません</p>
            ) : (
              <div className="space-y-4">
                {openRequests.map((request) => {
                  const categoryLabel = CATEGORY_CONFIG[request.category as RequestCategory]?.label

                  return (
                    <div
                      key={request.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{request.title}</h3>
                          <div className="flex gap-4 text-sm text-gray-500 mt-1">
                            <span>{categoryLabel}</span>
                            <span>¥{request.budget.toLocaleString()}</span>
                            <span>
                              {new Date(request.created_at).toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleClaim(request.id)}
                          disabled={claiming === request.id}
                          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {claiming === request.id ? '処理中...' : '担当する'}
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                        {request.content.substring(0, 150)}...
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Completed Requests */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">完了した案件</h2>

            {myRequests.filter((r) => r.status === 'completed').length === 0 ? (
              <p className="text-gray-500 text-center py-8">完了した案件はありません</p>
            ) : (
              <div className="space-y-4">
                {myRequests
                  .filter((r) => r.status === 'completed')
                  .map((request) => {
                    const categoryLabel = CATEGORY_CONFIG[request.category as RequestCategory]?.label

                    return (
                      <div
                        key={request.id}
                        className="p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{request.title}</h3>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            完了
                          </span>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>{categoryLabel}</span>
                          <span>¥{request.budget.toLocaleString()}</span>
                          <span>
                            完了: {request.completed_at && new Date(request.completed_at).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                      </div>
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
