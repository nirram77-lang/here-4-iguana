/**
 * 🦎 I4IGUANA - Google Places Search API Route
 * 
 * Proxies requests to Google Places API to avoid CORS issues
 * POST /api/google-places/search
 */

import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lng, radius, type } = body
    
    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Missing lat/lng parameters' },
        { status: 400 }
      )
    }
    
    if (!GOOGLE_API_KEY) {
      console.error('❌ Google Places API key not configured')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }
    
    // Build Google Places API URL
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
    url.searchParams.set('location', `${lat},${lng}`)
    url.searchParams.set('radius', String(radius || 5000))
    url.searchParams.set('type', type || 'bar')
    url.searchParams.set('key', GOOGLE_API_KEY)
    
    console.log(`🔍 Google Places search: type=${type}, radius=${radius}m`)
    
    const response = await fetch(url.toString())
    const data = await response.json()
    
    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      console.log(`✅ Found ${data.results?.length || 0} ${type}s`)
      return NextResponse.json({
        results: data.results || [],
        status: data.status
      })
    } else {
      console.error('❌ Google Places API error:', data.status, data.error_message)
      return NextResponse.json(
        { error: data.error_message || data.status, results: [] },
        { status: 500 }
      )
    }
    
  } catch (error: any) {
    console.error('❌ API route error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
