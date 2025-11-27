// app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { PASS_CONFIG, PREMIUM_PRICING } from '@/lib/constants'

// Initialize Firebase Admin (only once) - with safety check
let db: FirebaseFirestore.Firestore | null = null

try {
  if (getApps().length === 0 && process.env.FIREBASE_PROJECT_ID) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
      }),
    })
    db = getFirestore()
    console.log('✅ Firebase Admin initialized')
  } else if (getApps().length > 0) {
    db = getFirestore()
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin not initialized:', error)
  // This is OK during build time - webhooks only work at runtime
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    })
  : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  // Check if dependencies are available
  if (!db || !stripe || !webhookSecret) {
    console.error('❌ Stripe webhook dependencies not configured')
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('⚠️ Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error handling webhook:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!db) return

  const userId = session.metadata?.userId
  const productType = session.metadata?.productType
  const plan = session.metadata?.plan as 'weekly' | 'monthly' | undefined

  if (!userId) {
    console.error('No userId in session metadata')
    return
  }

  console.log(`✅ Payment successful for user ${userId}`)
  console.log(`Product type: ${productType}`)

  const userRef = db.collection('users').doc(userId)

  if (productType === 'skip_timer') {
    // Skip timer purchase - unlock user immediately
    await userRef.update({
      isLocked: false,
      lockUntil: 0,
      passesLeft: 1,
      matchesCountToday: 0,
      lastMatchTimestamp: 0,
      skipTimerPurchaseDate: FieldValue.serverTimestamp(),
      skipTimerPaymentId: session.payment_intent,
    })
    console.log('⚡ User unlocked via skip timer purchase')

  } else if (productType === 'premium' && plan) {
    // Premium upgrade
    const now = Date.now()
    const duration = plan === 'weekly' 
      ? PREMIUM_PRICING.WEEKLY.duration 
      : PREMIUM_PRICING.MONTHLY.duration
    const expiryDate = now + duration

    await userRef.update({
      isPremium: true,
      premiumType: plan,
      premiumExpiryDate: expiryDate,
      premiumUpgradedAt: FieldValue.serverTimestamp(),
      premiumPaymentId: session.payment_intent,
      premiumSubscriptionId: session.subscription,
      passesLeft: PASS_CONFIG.PREMIUM_PASSES,
      isLocked: false,
      lockUntil: 0,
    })
    console.log(`💎 User upgraded to ${plan} premium until ${new Date(expiryDate).toLocaleString()}`)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  if (!db) return

  const userId = subscription.metadata?.userId

  if (!userId) {
    console.error('No userId in subscription metadata')
    return
  }

  console.log(`📉 Subscription cancelled for user ${userId}`)

  const userRef = db.collection('users').doc(userId)
  await userRef.update({
    isPremium: false,
    premiumType: null,
    premiumExpiryDate: null,
    premiumSubscriptionId: null,
    passesLeft: PASS_CONFIG.FREE_PASSES,
  })

  console.log('User downgraded to free')
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  if (!db) return

  const userId = subscription.metadata?.userId

  if (!userId) {
    console.error('No userId in subscription metadata')
    return
  }

  console.log(`🔄 Subscription updated for user ${userId}`)

  // Handle subscription renewal or changes
  if (subscription.status === 'active') {
    const now = Date.now()
    const plan = subscription.metadata?.plan as 'weekly' | 'monthly'
    const duration = plan === 'weekly' 
      ? PREMIUM_PRICING.WEEKLY.duration 
      : PREMIUM_PRICING.MONTHLY.duration
    const expiryDate = now + duration

    const userRef = db.collection('users').doc(userId)
    await userRef.update({
      isPremium: true,
      premiumExpiryDate: expiryDate,
      premiumSubscriptionStatus: subscription.status,
    })

    console.log(`✅ Premium renewed until ${new Date(expiryDate).toLocaleString()}`)
  }
}