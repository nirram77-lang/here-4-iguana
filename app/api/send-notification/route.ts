/**
 * 🦎 I4IGUANA - Send Push Notification via OneSignal
 * 
 * This API route sends push notifications to users through OneSignal.
 * Called from the client when creating matches, sending messages, etc.
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
  try {
    const body: NotificationRequest = await request.json()
    
    console.log('📤 Sending push notification:', body)
    
    // Validate required fields
    if (!body.targetUserId || !body.title || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check for API key
    if (!ONESIGNAL_REST_API_KEY) {
      console.error('❌ ONESIGNAL_REST_API_KEY not configured!')
      return NextResponse.json(
        { error: 'Push notifications not configured' },
        { status: 500 }
      )
    }
    
    // Build OneSignal notification payload
    const notificationPayload = {
      app_id: ONESIGNAL_APP_ID,
      // Target specific user by external_user_id (set via OneSignal.login())
      include_aliases: {
        external_id: [body.targetUserId]
      },
      target_channel: "push",
      headings: { en: body.title },
      contents: { en: body.message },
      // Custom data for handling notification clicks
      data: {
        type: body.type,
        ...body.data
      },
      // iOS specific
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
      // Android specific
      android_channel_id: "default",
      // Icon
      small_icon: "notification_icon",
      large_icon: body.data?.fromUserPhoto || "",
      // URL to open when clicked
      url: "https://i4iguana.com/app"
    }
    
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
    
    if (!response.ok) {
      console.error('❌ OneSignal API error:', result)
      return NextResponse.json(
        { error: 'Failed to send notification', details: result },
        { status: response.status }
      )
    }
    
    console.log('✅ Push notification sent:', result)
    
    return NextResponse.json({
      success: true,
      notificationId: result.id,
      recipients: result.recipients
    })
    
  } catch (error) {
    console.error('❌ Error sending notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
