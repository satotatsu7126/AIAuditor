import { NextResponse } from 'next/server'
import { capturePaymentIntent } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId } = await request.json()

    // Get the request and verify the user is the assigned reviewer
    const { data: auditRequest, error: fetchError } = await supabase
      .from('audit_requests')
      .select('*, profiles!audit_requests_reviewer_id_fkey(role)')
      .eq('id', requestId)
      .single()

    if (fetchError || !auditRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (auditRequest.reviewer_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!auditRequest.payment_intent_id) {
      return NextResponse.json({ error: 'No payment intent found' }, { status: 400 })
    }

    // Capture the payment
    await capturePaymentIntent(auditRequest.payment_intent_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment capture error:', error)
    return NextResponse.json(
      { error: 'Failed to capture payment' },
      { status: 500 }
    )
  }
}
