'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import {
  CATEGORY_CONFIG,
  BUDGET_OPTIONS,
  type RequestCategory,
  type ITCodeOptions,
  type TranslationOptions,
  type AcademicOptions,
} from '@/types'

function RequestFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category') as RequestCategory | null
  const supabase = createClient()

  const [user, setUser] = useState<{ id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [category, setCategory] = useState<RequestCategory>(categoryParam || 'it_code')
  const [title, setTitle] = useState('')
  const [aiChatUrl, setAiChatUrl] = useState('')
  const [content, setContent] = useState('')
  const [budget, setBudget] = useState(3000)
  const [categoryOptions, setCategoryOptions] = useState<
    ITCodeOptions | TranslationOptions | AcademicOptions
  >({
    phase: 'learning',
    priority: 'fix',
    tech_level: 'beginner',
  })

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?next=/request?category=' + category)
        return
      }
      setUser({ id: user.id })
      setLoading(false)
    }
    checkUser()
  }, [category, router])

  useEffect(() => {
    // Reset category options when category changes
    if (category === 'it_code') {
      setCategoryOptions({
        phase: 'learning',
        priority: 'fix',
        tech_level: 'beginner',
      })
    } else if (category === 'translation') {
      setCategoryOptions({
        relationship: 'new',
        purpose: 'request',
        concerns: [],
      })
    } else if (category === 'academic') {
      setCategoryOptions({
        medium: 'undergraduate',
        focus: 'existence_check',
        policy: 'point_out_only',
      })
    }
  }, [category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    setError(null)

    try {
      // Create payment intent
      const paymentResponse = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: budget }),
      })

      if (!paymentResponse.ok) {
        throw new Error('決済の初期化に失敗しました')
      }

      const { clientSecret, paymentIntentId } = await paymentResponse.json()

      // Create request in database
      const { data, error: dbError } = await supabase
        .from('audit_requests')
        .insert({
          client_id: user.id,
          category,
          title,
          ai_chat_url: aiChatUrl || null,
          content,
          budget,
          category_options: categoryOptions,
          payment_intent_id: paymentIntentId,
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Redirect to payment page
      router.push(`/request/payment?request_id=${data.id}&client_secret=${clientSecret}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '依頼の作成に失敗しました')
      setSubmitting(false)
    }
  }

  const renderCategoryFields = () => {
    const config = CATEGORY_CONFIG[category]

    if (category === 'it_code') {
      const options = categoryOptions as ITCodeOptions
      return (
        <div className="space-y-4">
          {Object.entries(config.fields).map(([key, field]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
              </label>
              <div className="flex flex-wrap gap-2">
                {field.options.map((opt) => (
                  <label
                    key={opt.value}
                    className={`inline-flex items-center px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                      options[key as keyof ITCodeOptions] === opt.value
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={key}
                      value={opt.value}
                      checked={options[key as keyof ITCodeOptions] === opt.value}
                      onChange={(e) =>
                        setCategoryOptions({ ...options, [key]: e.target.value })
                      }
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (category === 'translation') {
      const options = categoryOptions as TranslationOptions
      return (
        <div className="space-y-4">
          {Object.entries(config.fields).map(([key, field]) => {
            if ('multiple' in field && field.multiple) {
              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}（複数選択可）
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {field.options.map((opt) => (
                      <label
                        key={opt.value}
                        className={`inline-flex items-center px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                          options.concerns.includes(opt.value as TranslationOptions['concerns'][number])
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          value={opt.value}
                          checked={options.concerns.includes(opt.value as TranslationOptions['concerns'][number])}
                          onChange={(e) => {
                            const value = e.target.value as TranslationOptions['concerns'][number]
                            const newConcerns = e.target.checked
                              ? [...options.concerns, value]
                              : options.concerns.filter((c) => c !== value)
                            setCategoryOptions({ ...options, concerns: newConcerns })
                          }}
                          className="sr-only"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              )
            }
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                </label>
                <div className="flex flex-wrap gap-2">
                  {field.options.map((opt) => (
                    <label
                      key={opt.value}
                      className={`inline-flex items-center px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                        options[key as 'relationship' | 'purpose'] === opt.value
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={key}
                        value={opt.value}
                        checked={options[key as 'relationship' | 'purpose'] === opt.value}
                        onChange={(e) =>
                          setCategoryOptions({ ...options, [key]: e.target.value })
                        }
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    if (category === 'academic') {
      const options = categoryOptions as AcademicOptions
      return (
        <div className="space-y-4">
          {Object.entries(config.fields).map(([key, field]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
              </label>
              <div className="flex flex-wrap gap-2">
                {field.options.map((opt) => (
                  <label
                    key={opt.value}
                    className={`inline-flex items-center px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                      options[key as keyof AcademicOptions] === opt.value
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={key}
                      value={opt.value}
                      checked={options[key as keyof AcademicOptions] === opt.value}
                      onChange={(e) =>
                        setCategoryOptions({ ...options, [key]: e.target.value })
                      }
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }

    return null
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
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">監査依頼を作成</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリ
              </label>
              <div className="grid grid-cols-3 gap-4">
                {(Object.keys(CATEGORY_CONFIG) as RequestCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-4 rounded-lg border-2 text-center transition-colors ${
                      category === cat
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{CATEGORY_CONFIG[cat].label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category-specific fields */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4">詳細設定</h3>
              {renderCategoryFields()}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                タイトル（40文字以内）
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 40))}
                required
                maxLength={40}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="例: ChatGPTで生成したログイン機能のレビュー"
              />
              <p className="text-sm text-gray-500 mt-1">{title.length}/40文字</p>
            </div>

            {/* AI Chat URL */}
            <div>
              <label htmlFor="aiChatUrl" className="block text-sm font-medium text-gray-700 mb-2">
                AIチャットのURL（任意）
              </label>
              <input
                type="url"
                id="aiChatUrl"
                value={aiChatUrl}
                onChange={(e) => setAiChatUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://chat.openai.com/share/..."
              />
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                監査対象のテキスト/コード
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                placeholder="AIが生成したコードや文章を貼り付けてください..."
              />
              <p className="text-sm text-gray-500 mt-1">Markdown形式に対応しています</p>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                希望予算
              </label>
              <div className="flex flex-wrap gap-2">
                {BUDGET_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`inline-flex items-center px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                      budget === opt.value
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="budget"
                      value={opt.value}
                      checked={budget === opt.value}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '処理中...' : '決済へ進む'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function RequestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </main>
        <Footer />
      </div>
    }>
      <RequestFormContent />
    </Suspense>
  )
}
