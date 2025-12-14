/**
 * 🦎 I4IGUANA - Reports API
 * 
 * View and manage user reports
 */

import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin if not already done
function getAdminDb() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    })
  }
  return getFirestore()
}

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    
    // Get all reports ordered by timestamp
    const reportsRef = db.collection('reports')
    const snapshot = await reportsRef.orderBy('timestamp', 'desc').limit(100).get()
    
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || null
    }))
    
    return NextResponse.json({
      success: true,
      count: reports.length,
      reports
    })
    
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch reports',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Update report status
export async function PATCH(request: NextRequest) {
  try {
    const db = getAdminDb()
    const { reportId, status } = await request.json()
    
    if (!reportId || !status) {
      return NextResponse.json({ error: 'reportId and status required' }, { status: 400 })
    }
    
    await db.collection('reports').doc(reportId).update({
      status,
      updatedAt: new Date()
    })
    
    return NextResponse.json({ success: true, reportId, status })
    
  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json({ 
      error: 'Failed to update report' 
    }, { status: 500 })
  }
}
