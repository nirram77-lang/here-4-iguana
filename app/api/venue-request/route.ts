import { NextRequest, NextResponse } from 'next/server'

// Using client-side Firebase for now (can be replaced with firebase-admin later)
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    
    // Validate required fields
    const requiredFields = ['venueName', 'venueType', 'address', 'city', 'latitude', 'longitude', 'ownerName', 'phone', 'email', 'capacity']
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate coordinates
    const lat = parseFloat(data.latitude)
    const lng = parseFloat(data.longitude)
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return NextResponse.json(
        { success: false, error: 'Invalid latitude' },
        { status: 400 }
      )
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return NextResponse.json(
        { success: false, error: 'Invalid longitude' },
        { status: 400 }
      )
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Import Firebase dynamically (client-side approach)
    const { initializeApp, getApps } = await import('firebase/app')
    const { getFirestore, collection, addDoc, Timestamp } = await import('firebase/firestore')
    
    // Firebase config
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }
    
    // Initialize Firebase
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    const db = getFirestore(app)

    // Create venue request document
    const venueRequest = {
      // Venue Info
      venueName: data.venueName,
      venueType: data.venueType,
      country: data.country || 'Israel',
      city: data.city,
      address: data.address,
      postalCode: data.postalCode || '',
      location: {
        latitude: lat,
        longitude: lng
      },
      
      // Owner Info
      ownerName: data.ownerName,
      ownerPhone: data.phone,
      ownerEmail: data.email,
      
      // Additional Info
      website: data.website || '',
      instagram: data.instagram || '',
      facebook: data.facebook || '',
      openingHours: data.openingHours || '20:00',
      closingHours: data.closingHours || '03:00',
      capacity: data.capacity ? parseInt(data.capacity) : null,
      description: data.description || '',
      logoUrl: '',
      language: data.language || 'en',
      
      // Meta
      status: 'pending', // pending, approved, rejected
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      notes: '',
      reviewedBy: null,
      reviewedAt: null
    }

    // Save to Firestore
    const docRef = await addDoc(collection(db, 'venueRequests'), venueRequest)
    
    console.log(`✅ New venue request created: ${docRef.id}`)
    console.log(`   Venue: ${data.venueName} (${data.city})`)
    console.log(`   Owner: ${data.ownerName} - ${data.email}`)

    // Send email notification to admin (if SendGrid is configured)
    try {
      const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
      if (SENDGRID_API_KEY) {
        const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: 'nir@i4iguana.com' }]
            }],
            from: { email: 'alerts@i4iguana.com', name: 'I4IGUANA' },
            subject: `🦎 בקשת הצטרפות חדשה: ${data.venueName}`,
            content: [{
              type: 'text/html',
              value: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(to right, #4ade80, #22c55e); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🦎 בקשת הצטרפות חדשה!</h1>
                  </div>
                  <div style="padding: 20px; background: #f8f9fa;">
                    <h2 style="color: #333;">${data.venueName}</h2>
                    <p style="color: #666;"><strong>סוג:</strong> ${data.venueType}</p>
                    <p style="color: #666;"><strong>עיר:</strong> ${data.city}</p>
                    <p style="color: #666;"><strong>כתובת:</strong> ${data.address}</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <h3 style="color: #333;">פרטי בעל העסק:</h3>
                    <p style="color: #666;"><strong>שם:</strong> ${data.ownerName}</p>
                    <p style="color: #666;"><strong>טלפון:</strong> ${data.phone}</p>
                    <p style="color: #666;"><strong>אימייל:</strong> ${data.email}</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666;"><strong>קואורדינטות:</strong> ${lat}, ${lng}</p>
                    <a href="https://maps.google.com/?q=${lat},${lng}" style="color: #4ade80;">פתח במפות</a>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <h3 style="color: #333;">JSON להעתקה:</h3>
                    <pre style="background: #1a1a1a; color: #4ade80; padding: 15px; border-radius: 8px; font-size: 12px; overflow-x: auto;">
{
  "name": "${data.venueName}",
  "address": "${data.address} ${data.city}",
  "latitude": ${lat},
  "longitude": ${lng},
  "adminEmail": "${data.email}",
  "adminName": "${data.ownerName}",
  "adminPhone": "${data.phone}"
}
                    </pre>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <a href="https://i4iguana-app.vercel.app/admin/super" 
                       style="display: inline-block; background: #4ade80; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                      פתח את פאנל Admin
                    </a>
                  </div>
                </div>
              `
            }]
          })
        })
        
        if (emailResponse.ok) {
          console.log('📧 Email notification sent to admin')
        } else {
          console.log('⚠️ Email notification failed:', await emailResponse.text())
        }
      } else {
        console.log('ℹ️ SendGrid not configured - skipping email notification')
      }
    } catch (emailError) {
      console.error('⚠️ Error sending email notification:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      requestId: docRef.id,
      message: 'Venue request submitted successfully'
    })

  } catch (error: any) {
    console.error('❌ Error creating venue request:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit request' },
      { status: 500 }
    )
  }
}
