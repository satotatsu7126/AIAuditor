import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

// Create a payment intent with manual capture (authorization only)
export async function createPaymentIntent(amount: number, metadata: Record<string, string>) {
  return await stripe.paymentIntents.create({
    amount: amount, // Amount in cents (yen)
    currency: 'jpy',
    capture_method: 'manual', // Auth only, capture later
    metadata,
  })
}

// Capture a payment intent (execute the charge)
export async function capturePaymentIntent(paymentIntentId: string) {
  return await stripe.paymentIntents.capture(paymentIntentId)
}

// Cancel a payment intent (release the authorization)
export async function cancelPaymentIntent(paymentIntentId: string) {
  return await stripe.paymentIntents.cancel(paymentIntentId)
}

// Get payment intent details
export async function getPaymentIntent(paymentIntentId: string) {
  return await stripe.paymentIntents.retrieve(paymentIntentId)
}
