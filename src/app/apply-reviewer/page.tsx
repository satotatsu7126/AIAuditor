'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types'

export default function ApplyReviewerPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [note, setNote] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/login?next=/apply-reviewer')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      setUser(profile)
      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'reviewer',
          reviewer_application_status: 'pending',
          reviewer_application_note: note,
        })
        .eq('id', user.id)

      if (error) throw error

      setSuccess(true)
    } catch (error) {
      alert('申請に失敗しました')
    }

    setSubmitting(false)
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

  // Already a reviewer
  if (user?.role === 'reviewer') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-white p-8 rounded-lg shadow-md">
              {user.is_reviewer_approved ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold mb-4">承認済みです</h1>
                  <p className="text-gray-600 mb-6">
                    専門家として承認されています。ダッシュボードから案件を確認できます。
                  </p>
                  <a
                    href="/reviewer"
                    className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    専門家ダッシュボードへ
                  </a>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold mb-4">審査中です</h1>
                  <p className="text-gray-600 mb-6">
                    専門家への申請が審査中です。承認されるまでしばらくお待ちください。
                  </p>
                </>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-4">申請が完了しました</h1>
              <p className="text-gray-600 mb-6">
                専門家への申請を受け付けました。審査結果をお待ちください。
              </p>
              <a
                href="/dashboard"
                className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                マイページへ
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">専門家として登録</h1>

          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4">専門家とは</h2>
            <p className="text-gray-600 mb-4">
              AI Auditorの専門家として、AIの成果物（コード、翻訳、論文など）を監査し、
              クライアントに品質保証を提供する役割です。
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>承認制：申請後、管理者による審査があります</li>
              <li>対応可能な案件を選んで担当できます</li>
              <li>監査完了後に報酬が支払われます</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">申請フォーム</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  アカウント情報
                </label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm"><span className="text-gray-500">メール:</span> {user?.email}</p>
                  <p className="text-sm"><span className="text-gray-500">表示名:</span> {user?.display_name || '未設定'}</p>
                </div>
              </div>

              <div>
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                  自己紹介・専門分野
                </label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="あなたの専門分野、経験、スキルについて教えてください..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !note}
                className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '申請中...' : '専門家として申請する'}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
