'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function PaymentForm({ requestId }: { requestId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/request/complete?request_id=${requestId}`,
      },
    })

    if (submitError) {
      setError(submitError.message || '決済処理に失敗しました')
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? '処理中...' : '決済を確定する'}
      </button>
      <p className="text-sm text-gray-500 text-center">
        ※ 仮払いです。監査完了後に決済が確定されます。
      </p>
    </form>
  )
}

function PaymentPageContent() {
  const searchParams = useSearchParams()
  const clientSecret = searchParams.get('client_secret')
  const requestId = searchParams.get('request_id')

  if (!clientSecret || !requestId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">エラー</h1>
            <p className="text-gray-600">決済情報が見つかりません</p>
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
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-8 text-center">お支払い</h1>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: { theme: 'stripe' },
              }}
            >
              <PaymentForm requestId={requestId} />
            </Elements>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function PaymentPage() {
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
      <PaymentPageContent />
    </Suspense>
  )
}
