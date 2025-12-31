'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import {
  CATEGORY_CONFIG,
  type AuditRequest,
  type RequestCategory,
  type Verdict,
} from '@/types'

export default function ReviewerWorkPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string
  const supabase = createClient()

  const [request, setRequest] = useState<AuditRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [verdict, setVerdict] = useState<Verdict>('approved')
  const [comment, setComment] = useState('')
  const [revision, setRevision] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Fetch request
      const { data: requestData, error: requestError } = await supabase
        .from('audit_requests')
        .select('*')
        .eq('id', requestId)
        .eq('reviewer_id', user.id)
        .eq('status', 'in_progress')
        .single()

      if (requestError || !requestData) {
        router.push('/reviewer')
        return
      }

      setRequest(requestData)
      setLoading(false)
    }

    fetchData()
  }, [requestId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !request) throw new Error('認証エラー')

      // Create delivery
      const { error: deliveryError } = await supabase
        .from('audit_deliveries')
        .insert({
          request_id: request.id,
          reviewer_id: user.id,
          verdict,
          comment,
          revision: revision || null,
        })

      if (deliveryError) throw deliveryError

      // Update request status
      const { error: updateError } = await supabase
        .from('audit_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', request.id)

      if (updateError) throw updateError

      // Capture payment
      const captureResponse = await fetch('/api/payment/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.id }),
      })

      if (!captureResponse.ok) {
        console.error('Payment capture warning:', await captureResponse.text())
        // Continue even if payment capture fails - it can be retried by admin
      }

      router.push('/reviewer?completed=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : '納品に失敗しました')
      setSubmitting(false)
    }
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

  if (!request) {
    return null
  }

  const categoryLabel = CATEGORY_CONFIG[request.category as RequestCategory]?.label

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/reviewer"
            className="text-primary-600 hover:underline mb-4 inline-block"
          >
            ← ダッシュボードに戻る
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Request Details */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-xl font-bold mb-4">{request.title}</h1>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500 block">カテゴリ</span>
                    <span className="font-medium">{categoryLabel}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">報酬</span>
                    <span className="font-medium">¥{request.budget.toLocaleString()}</span>
                  </div>
                </div>

                {request.ai_chat_url && (
                  <div className="mb-4">
                    <span className="text-gray-500 block text-sm">AIチャットURL</span>
                    <a
                      href={request.ai_chat_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline break-all text-sm"
                    >
                      {request.ai_chat_url}
                    </a>
                  </div>
                )}

                <div className="mb-4">
                  <span className="text-gray-500 block text-sm mb-2">詳細設定</span>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(request.category_options, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-4">監査対象コンテンツ</h2>
                <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto max-h-[500px] overflow-y-auto">
                  <div className="markdown-content">
                    <ReactMarkdown>{request.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Delivery Form */}
            <div className="bg-white p-6 rounded-lg shadow-md h-fit sticky top-4">
              <h2 className="text-lg font-semibold mb-4">監査レポート作成</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Verdict */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    総合判定
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'approved', label: '合格', color: 'bg-green-100 text-green-800 border-green-300' },
                      { value: 'needs_revision', label: '要修正', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
                      { value: 'dangerous', label: '危険(作り直し)', color: 'bg-red-100 text-red-800 border-red-300' },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`inline-flex items-center px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                          verdict === opt.value
                            ? opt.color + ' border-2'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="verdict"
                          value={opt.value}
                          checked={verdict === opt.value}
                          onChange={(e) => setVerdict(e.target.value as Verdict)}
                          className="sr-only"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                    監査コメント
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="監査結果の詳細、問題点、改善提案などを記載してください..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Markdown形式に対応</p>
                </div>

                {/* Revision */}
                <div>
                  <label htmlFor="revision" className="block text-sm font-medium text-gray-700 mb-2">
                    修正案（任意）
                  </label>
                  <textarea
                    id="revision"
                    value={revision}
                    onChange={(e) => setRevision(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                    placeholder="修正後のコードや文章を記載してください..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Markdown / コードブロック対応</p>
                </div>

                {error && (
                  <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !comment}
                  className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '納品中...' : '納品する'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
