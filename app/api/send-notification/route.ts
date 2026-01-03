/**
 * 🦎 I4IGUANA - Send Push Notification via OneSignal
 * 
 * This API route sends push notifications to users through OneSignal.
 * Called from the client when creating matches, sending messages, etc.
 * 
 * ⚠️ CRITICAL: Requires ONESIGNAL_REST_API_KEY environment variable!
 */

import { NextRequest, NextResponse } from 'next/server'

// OneSignal Configuration
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || 'e0009025-1eac-434c-ba27-353c60b0fcf7'
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY

interface NotificationRequest {
  type: 'match' | 'message' | 'meeting' | 'like'
  targetUserId: string
  title: string
  message: string
  data?: {
    matchId?: string
    chatId?: string
    fromUserId?: string
    fromUserName?: string
    fromUserPhoto?: string
  }
}

export async function POST(request: NextRequest) {
  console.log('═══════════════════════════════════════════════════')
  console.log('📤 PUSH NOTIFICATION API CALLED')
  console.log('═══════════════════════════════════════════════════')
  
  try {
    const body: NotificationRequest = await request.json()
    
    console.log('📦 Request body:', JSON.stringify(body, null, 2))
    
    // Validate required fields
    if (!body.targetUserId || !body.title || !body.message) {
      console.error('❌ Missing required fields!')
      return NextResponse.json(
        { error: 'Missing required fields', received: { targetUserId: !!body.targetUserId, title: !!body.title, message: !!body.message } },
        { status: 400 }
      )
    }
    
    // ⚠️ CRITICAL CHECK: API key must be configured
    if (!ONESIGNAL_REST_API_KEY) {
      console.error('═══════════════════════════════════════════════════')
      console.error('❌ CRITICAL ERROR: ONESIGNAL_REST_API_KEY NOT SET!')
      console.error('═══════════════════════════════════════════════════')
      console.error('Please add ONESIGNAL_REST_API_KEY to Vercel environment variables!')
      console.error('Get it from: https://onesignal.com/dashboard → Settings → Keys & IDs')
      console.error('═══════════════════════════════════════════════════')
      return NextResponse.json(
        { 
          error: 'ONESIGNAL_REST_API_KEY not configured!',
          help: 'Add ONESIGNAL_REST_API_KEY to Vercel environment variables. Get it from OneSignal Dashboard → Settings → Keys & IDs'
        },
        { status: 500 }
      )
    }
    
    console.log('✅ API Key configured (starts with:', ONESIGNAL_REST_API_KEY.substring(0, 8) + '...)')
    console.log('🎯 Target user:', body.targetUserId)
    
    // ✅ v2.8.22 FIX: Simplified payload to avoid size limits
    // Only include essential data, limit to avoid 2048 byte limit
    const notificationPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: [body.targetUserId],
      target_channel: "push",
      headings: { en: body.title },
      contents: { en: body.message },
      // ✅ Minimal data - just type and matchId
      data: {
        type: body.type || 'message',
        matchId: body.data?.matchId || ''
      },
      // iOS specific
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
      // ✅ v2.8.22 FIX: Only use web_url, remove url to avoid conflict
      web_url: "https://i4iguana.com/app"
    }
    
    console.log('📤 Sending to OneSignal API...')
    console.log('📦 Payload:', JSON.stringify(notificationPayload, null, 2))
    
    // Send to OneSignal API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(notificationPayload)
    })
    
    const result = await response.json()
    
    console.log('📨 OneSignal Response Status:', response.status)
    console.log('📨 OneSignal Response:', JSON.stringify(result, null, 2))
    
    if (!response.ok) {
      console.error('❌ OneSignal API error!')
      console.error('Status:', response.status)
      console.error('Result:', result)
      
      // Check for common errors
      if (result.errors && result.errors.includes('All included players are not subscribed')) {
        console.warn('⚠️ User not subscribed to push notifications!')
        console.warn('User needs to: 1) Allow notifications in browser, 2) Have OneSignal.login() called with their userId')
      }
      
      return NextResponse.json(
        { error: 'Failed to send notification', details: result },
        { status: response.status }
      )
    }
    
    console.log('═══════════════════════════════════════════════════')
    console.log('✅ PUSH NOTIFICATION SENT SUCCESSFULLY!')
    console.log('   Notification ID:', result.id)
    console.log('   Recipients:', result.recipients)
    console.log('═══════════════════════════════════════════════════')
    
    return NextResponse.json({
      success: true,
      notificationId: result.id,
      recipients: result.recipients
    })
    
  } catch (error) {
    console.error('═══════════════════════════════════════════════════')
    console.error('❌ ERROR IN SEND-NOTIFICATION API!')
    console.error('Error:', error)
    console.error('═══════════════════════════════════════════════════')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
