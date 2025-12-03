// app/api/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Check if Stripe key exists
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY is not set!')
}

const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2025-10-29.clover',
})

export async function POST(req: NextRequest) {
  try {
    // Log to verify key is loaded (first 20 chars only for security)
    console.log('🔑 Stripe key loaded:', stripeSecretKey ? `${stripeSecretKey.substring(0, 20)}...` : 'NOT SET')
    
    const body = await req.json()
    const { userId, plan } = body

    if (!userId || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and plan' },
        { status: 400 }
      )
    }

    // Validate plan
    if (!['weekly', 'monthly', 'skip-timer'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be: weekly, monthly, or skip-timer' },
        { status: 400 }
      )
    }

    // Get price ID based on plan - Using hardcoded Price IDs for reliability
    let priceId: string
    let mode: 'subscription' | 'payment'

    if (plan === 'weekly') {
      priceId = 'price_1SOA29GgzDjUcfZ0mpJ03Rn9'  // Weekly Premium $4.90
      mode = 'subscription'
    } else if (plan === 'monthly') {
      priceId = 'price_1SOA5KGgzDjUcfZ0ck2C4RMO'  // Monthly Premium $9.90
      mode = 'subscription'
    } else {
      // skip-timer (1 Pass)
      priceId = 'price_1SOA6qGgzDjUcfZ0hRZ7UtRS'  // Skip Timer $2.90
      mode = 'payment'
    }

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`

    console.log('💳 Creating Stripe checkout session:', {
      userId,
      plan,
      priceId,
      mode,
    })

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        userId,
        plan,
      },
    })

    console.log('✅ Checkout session created:', session.id)

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    })
  } catch (error: any) {
    console.error('❌ Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
