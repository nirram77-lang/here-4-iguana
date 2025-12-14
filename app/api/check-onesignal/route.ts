/**
 * 🦎 I4IGUANA - Check OneSignal Configuration
 * 
 * Debug endpoint to verify OneSignal is configured correctly
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || 'e0009025-1eac-434c-ba27-353c60b0fcf7'
  const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY
  
  const status = {
    timestamp: new Date().toISOString(),
    appId: ONESIGNAL_APP_ID,
    apiKeyConfigured: !!ONESIGNAL_REST_API_KEY,
    apiKeyPreview: ONESIGNAL_REST_API_KEY 
      ? ONESIGNAL_REST_API_KEY.substring(0, 10) + '...' + ONESIGNAL_REST_API_KEY.slice(-5)
      : 'NOT SET!',
    apiKeyLength: ONESIGNAL_REST_API_KEY?.length || 0,
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV || 'unknown'
  }
  
  console.log('🔍 OneSignal Configuration Check:', status)
  
  return NextResponse.json(status)
}

// POST - Send test notification to a specific user
export async function POST(request: NextRequest) {
  const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || 'e0009025-1eac-434c-ba27-353c60b0fcf7'
  const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY
  
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }
    
    if (!ONESIGNAL_REST_API_KEY) {
      return NextResponse.json({ 
        error: 'ONESIGNAL_REST_API_KEY not configured!',
        help: 'Add it to Vercel Environment Variables'
      }, { status: 500 })
    }
    
    console.log('🧪 Sending TEST notification to:', userId)
    
    const notificationPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_aliases: {
        external_id: [userId]
      },
      target_channel: "push",
      headings: { en: "🧪 Test Notification" },
      contents: { en: "If you see this, push notifications are working! 🎉" },
      data: { type: 'test' },
      url: "https://i4iguana.com/app",
      web_url: "https://i4iguana.com/app"
    }
    
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(notificationPayload)
    })
    
    const result = await response.json()
    
    console.log('📨 OneSignal Test Response:', result)
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      result,
      targetUserId: userId
    })
    
  } catch (error) {
    console.error('❌ Test notification error:', error)
    return NextResponse.json({ 
      error: 'Failed to send test notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
