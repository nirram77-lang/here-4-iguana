// app/api/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover', // ✅ FIXED: Latest Stripe API version
  typescript: true,
})

export async function POST(req: NextRequest) {
  try {
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

    // Get price ID based on plan
    let priceId: string
    let mode: 'subscription' | 'payment'

    if (plan === 'weekly') {
      priceId = process.env.NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID || 'price_1SOA29GgzDjUcfZ0mpJ03Rn9'
      mode = 'subscription'
    } else if (plan === 'monthly') {
      priceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_1SOA5KGgzDjUcfZ0ck2C4RMO'
      mode = 'subscription'
    } else {
      // skip-timer
      priceId = process.env.NEXT_PUBLIC_STRIPE_SKIP_TIMER_PRICE_ID || 'price_1SOA6qGgzDjUcfZ0hRZ7UtRS'
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
