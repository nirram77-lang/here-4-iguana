import Stripe from 'stripe'
import { STRIPE_CONFIG, PREMIUM_PRICING } from './constants'

// Initialize Stripe
const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: '2025-10-29.clover', // ✅ FIXED: Latest Stripe API version
  typescript: true,
})

export interface CheckoutSessionParams {
  userId: string
  plan: 'weekly' | 'monthly' | 'skip-timer'
}

export async function createStripeCheckoutSession(
  userId: string,
  plan: 'weekly' | 'monthly' | 'skip-timer'
): Promise<{ url: string | null; sessionId: string }> {
  try {
    let priceId: string
    let mode: 'subscription' | 'payment'
    let successUrl = `${STRIPE_CONFIG.successUrl}?session_id={CHECKOUT_SESSION_ID}`
    let cancelUrl = STRIPE_CONFIG.cancelUrl

    // Determine price ID and mode based on plan
    switch (plan) {
      case 'weekly':
        priceId = PREMIUM_PRICING.WEEKLY.stripePriceId
        mode = 'subscription'
        break
      case 'monthly':
        priceId = PREMIUM_PRICING.MONTHLY.stripePriceId
        mode = 'subscription'
        break
      case 'skip-timer':
        priceId = PREMIUM_PRICING.SKIP_TIMER.stripePriceId
        mode = 'payment'
        break
      default:
        throw new Error(`Invalid plan: ${plan}`)
    }

    console.log(`💳 Creating Stripe checkout session:`)
    console.log(`   User ID: ${userId}`)
    console.log(`   Plan: ${plan}`)
    console.log(`   Price ID: ${priceId}`)
    console.log(`   Mode: ${mode}`)

    // Create checkout session
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
      metadata: {
        userId,
        plan,
      },
      client_reference_id: userId,
    })

    console.log(`✅ Checkout session created: ${session.id}`)
    console.log(`   URL: ${session.url}`)

    return {
      url: session.url,
      sessionId: session.id,
    }
  } catch (error) {
    console.error('❌ Error creating Stripe checkout session:', error)
    throw error
  }
}

export async function handleStripeWebhook(
  body: string,
  signature: string
): Promise<void> {
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    )

    console.log(`🔔 Stripe webhook received: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      default:
        console.log(`⚠️  Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('❌ Webhook error:', error)
    throw error
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId || session.client_reference_id
  const plan = session.metadata?.plan

  if (!userId) {
    console.error('❌ No userId in session metadata')
    return
  }

  console.log(`✅ Checkout completed for user ${userId}, plan: ${plan}`)

  // Update user in Firestore
  const { getFirestore } = await import('firebase-admin/firestore')
  const db = getFirestore()

  try {
    const updates: any = {
      lastPaymentDate: new Date().toISOString(),
      lastPaymentId: session.id,
    }

    if (plan === 'skip-timer') {
      // Skip timer - unlock immediately
      updates.isLocked = false
      updates.skipTimerPurchaseDate = Date.now()
      updates.skipTimerPaymentId = session.payment_intent
      updates.passesLeft = 1
      console.log(`⚡ Skip timer activated for user ${userId}`)
    } else {
      // Premium subscription
      updates.isPremium = true
      updates.premiumType = plan
      updates.premiumPaymentId = session.payment_intent
      updates.premiumSubscriptionId = session.subscription

      // Set expiry date
      const duration = plan === 'weekly' 
        ? PREMIUM_PRICING.WEEKLY.duration 
        : PREMIUM_PRICING.MONTHLY.duration
      updates.premiumExpiryDate = Date.now() + duration

      console.log(`👑 Premium (${plan}) activated for user ${userId}`)
    }

    await db.collection('users').doc(userId).update(updates)
    console.log(`✅ User ${userId} updated in Firestore`)
  } catch (error) {
    console.error(`❌ Error updating user ${userId}:`, error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId

  if (!userId) {
    console.error('❌ No userId in subscription metadata')
    return
  }

  console.log(`🚫 Subscription deleted for user ${userId}`)

  const { getFirestore } = await import('firebase-admin/firestore')
  const db = getFirestore()

  try {
    await db.collection('users').doc(userId).update({
      isPremium: false,
      premiumType: null,
      premiumExpiryDate: null,
      premiumSubscriptionId: null,
    })

    console.log(`✅ Premium removed for user ${userId}`)
  } catch (error) {
    console.error(`❌ Error removing premium for user ${userId}:`, error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId

  if (!userId) {
    console.error('❌ No userId in subscription metadata')
    return
  }

  console.log(`🔄 Subscription updated for user ${userId}`)

  // You can add logic here to handle subscription updates
  // For example, renewal, plan changes, etc.
}

export async function getStripeCustomer(userId: string): Promise<Stripe.Customer | null> {
  try {
    const customers = await stripe.customers.list({
      limit: 1,
      email: userId, // Assuming userId is email, adjust as needed
    })

    return customers.data[0] || null
  } catch (error) {
    console.error('❌ Error fetching Stripe customer:', error)
    return null
  }
}