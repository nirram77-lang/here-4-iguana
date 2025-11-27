import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'

/**
 * POST /api/admin/update-password
 * 
 * Updates venue admin password in Firebase Authentication
 * Only accessible by super admin
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { adminUid, newPassword } = body

    // Validation
    if (!adminUid || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields: adminUid, newPassword' },
        { status: 400 }
      )
    }

    // Password validation
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    console.log('🔑 Updating password for admin:', adminUid)

    // Get admin auth instance
    const adminAuth = getAdminAuth()

    // Update password in Firebase Auth using Admin SDK
    await adminAuth.updateUser(adminUid, {
      password: newPassword
    })

    console.log('✅ Password updated successfully in Firebase Auth')

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error: any) {
    console.error('❌ Error updating password:', error)

    // Handle specific Firebase errors
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      )
    }

    if (error.code === 'auth/invalid-password') {
      return NextResponse.json(
        { error: 'Invalid password format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update password' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/update-password
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Admin password update API'
  })
}
