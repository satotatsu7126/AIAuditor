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
  STATUS_LABELS,
  VERDICT_LABELS,
  type AuditRequest,
  type AuditDelivery,
  type RequestCategory,
  type Verdict,
} from '@/types'

export default function RequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string
  const supabase = createClient()

  const [request, setRequest] = useState<AuditRequest | null>(null)
  const [delivery, setDelivery] = useState<AuditDelivery | null>(null)
  const [loading, setLoading] = useState(true)

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
        .eq('client_id', user.id)
        .single()

      if (requestError || !requestData) {
        router.push('/dashboard')
        return
      }

      setRequest(requestData)

      // Fetch delivery if completed
      if (requestData.status === 'completed') {
        const { data: deliveryData } = await supabase
          .from('audit_deliveries')
          .select('*')
          .eq('request_id', requestId)
          .single()

        setDelivery(deliveryData)
      }

      setLoading(false)
    }

    fetchData()
  }, [requestId, router])

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

  const statusLabel = STATUS_LABELS[request.status]
  const categoryLabel = CATEGORY_CONFIG[request.category as RequestCategory]?.label

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/dashboard"
            className="text-primary-600 hover:underline mb-4 inline-block"
          >
            ← マイページに戻る
          </Link>

          {/* Request Header */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold">{request.title}</h1>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${statusLabel.color}`}
              >
                {statusLabel.label}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block">カテゴリ</span>
                <span className="font-medium">{categoryLabel}</span>
              </div>
              <div>
                <span className="text-gray-500 block">予算</span>
                <span className="font-medium">¥{request.budget.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500 block">作成日</span>
                <span className="font-medium">
                  {new Date(request.created_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
              {request.completed_at && (
                <div>
                  <span className="text-gray-500 block">完了日</span>
                  <span className="font-medium">
                    {new Date(request.completed_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              )}
            </div>

            {request.ai_chat_url && (
              <div className="mt-4">
                <span className="text-gray-500 block text-sm">AIチャットURL</span>
                <a
                  href={request.ai_chat_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline break-all"
                >
                  {request.ai_chat_url}
                </a>
              </div>
            )}
          </div>

          {/* Request Content */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4">監査対象コンテンツ</h2>
            <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
              <div className="markdown-content">
                <ReactMarkdown>{request.content}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Delivery (if completed) */}
          {delivery && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">監査レポート</h2>

              {/* Verdict */}
              <div className="mb-6">
                <span className="text-gray-500 block text-sm mb-2">総合判定</span>
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                    VERDICT_LABELS[delivery.verdict as Verdict].color
                  }`}
                >
                  {VERDICT_LABELS[delivery.verdict as Verdict].label}
                </span>
              </div>

              {/* Comment */}
              <div className="mb-6">
                <span className="text-gray-500 block text-sm mb-2">監査コメント</span>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="markdown-content">
                    <ReactMarkdown>{delivery.comment}</ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Revision */}
              {delivery.revision && (
                <div>
                  <span className="text-gray-500 block text-sm mb-2">修正案</span>
                  <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                    <div className="markdown-content">
                      <ReactMarkdown>{delivery.revision}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Waiting Message */}
          {request.status === 'open' && (
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <p className="text-blue-700">
                専門家がマッチングされるまでお待ちください。
              </p>
            </div>
          )}

          {request.status === 'in_progress' && (
            <div className="bg-yellow-50 p-6 rounded-lg text-center">
              <p className="text-yellow-700">
                専門家が監査作業中です。完了までお待ちください。
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
