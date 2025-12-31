'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile, PlatformSettings } from '@/types'

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [pendingReviewers, setPendingReviewers] = useState<UserProfile[]>([])
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [feeRate, setFeeRate] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      // Fetch pending reviewer applications
      const { data: pending } = await supabase
        .from('profiles')
        .select('*')
        .eq('reviewer_application_status', 'pending')
        .order('created_at', { ascending: false })

      setPendingReviewers(pending || [])

      // Fetch platform settings
      const { data: platformSettings } = await supabase
        .from('platform_settings')
        .select('*')
        .single()

      if (platformSettings) {
        setSettings(platformSettings)
        setFeeRate((platformSettings.fee_rate * 100).toString())
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleApprove = async (userId: string) => {
    setProcessingId(userId)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_reviewer_approved: true,
          reviewer_application_status: 'approved',
        })
        .eq('id', userId)

      if (error) throw error

      setPendingReviewers(pendingReviewers.filter((r) => r.id !== userId))
    } catch (error) {
      alert('承認に失敗しました')
    }

    setProcessingId(null)
  }

  const handleReject = async (userId: string) => {
    setProcessingId(userId)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'client',
          is_reviewer_approved: false,
          reviewer_application_status: 'rejected',
        })
        .eq('id', userId)

      if (error) throw error

      setPendingReviewers(pendingReviewers.filter((r) => r.id !== userId))
    } catch (error) {
      alert('却下に失敗しました')
    }

    setProcessingId(null)
  }

  const handleSaveSettings = async () => {
    if (!settings) return

    setSavingSettings(true)

    try {
      const newFeeRate = parseFloat(feeRate) / 100

      if (isNaN(newFeeRate) || newFeeRate < 0 || newFeeRate > 100) {
        throw new Error('手数料率は0〜100の範囲で入力してください')
      }

      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('platform_settings')
        .update({
          fee_rate: newFeeRate,
          updated_by: user?.id,
        })
        .eq('id', settings.id)

      if (error) throw error

      alert('設定を保存しました')
    } catch (error) {
      alert(error instanceof Error ? error.message : '保存に失敗しました')
    }

    setSavingSettings(false)
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
          <h1 className="text-3xl font-bold mb-8">管理画面</h1>

          {/* Platform Settings */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-lg font-semibold mb-4">プラットフォーム設定</h2>

            <div className="flex items-end gap-4">
              <div className="flex-grow max-w-xs">
                <label htmlFor="feeRate" className="block text-sm font-medium text-gray-700 mb-2">
                  手数料率（%）
                </label>
                <input
                  type="number"
                  id="feeRate"
                  value={feeRate}
                  onChange={(e) => setFeeRate(e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  0% = 手数料なし（Stripe手数料のみ）
                </p>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {savingSettings ? '保存中...' : '保存'}
              </button>
            </div>
          </div>

          {/* Pending Reviewer Applications */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">
              専門家申請（{pendingReviewers.length}件）
            </h2>

            {pendingReviewers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                審査待ちの申請はありません
              </p>
            ) : (
              <div className="space-y-4">
                {pendingReviewers.map((reviewer) => (
                  <div
                    key={reviewer.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <h3 className="font-medium">
                          {reviewer.display_name || '名前未設定'}
                        </h3>
                        <p className="text-sm text-gray-500">{reviewer.email}</p>
                        <p className="text-sm text-gray-500">
                          申請日: {new Date(reviewer.created_at).toLocaleDateString('ja-JP')}
                        </p>
                        {reviewer.reviewer_application_note && (
                          <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                            <p className="text-gray-500 mb-1">自己紹介:</p>
                            <p className="whitespace-pre-wrap">{reviewer.reviewer_application_note}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleApprove(reviewer.id)}
                          disabled={processingId === reviewer.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          承認
                        </button>
                        <button
                          onClick={() => handleReject(reviewer.id)}
                          disabled={processingId === reviewer.id}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          却下
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
