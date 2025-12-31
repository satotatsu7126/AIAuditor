'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

function CompletePageContent() {
  const searchParams = useSearchParams()
  const requestId = searchParams.get('request_id')
  const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret')

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4">依頼が完了しました</h1>
            <p className="text-gray-600 mb-6">
              監査依頼が正常に作成されました。
              <br />
              専門家がマッチングされるまでお待ちください。
            </p>
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="block w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                マイページで確認する
              </Link>
              <Link
                href="/"
                className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                トップに戻る
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function CompletePage() {
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
      <CompletePageContent />
    </Suspense>
  )
}
