import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'

let adminApp: App | null = null
let adminAuthInstance: Auth | null = null

/**
 * Initialize Firebase Admin SDK (lazy)
 */
function initAdmin(): App {
  // Check if already initialized
  if (adminApp) {
    return adminApp
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0]
    return adminApp
  }

  try {
    // Using environment variables
    if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      })
      
      return adminApp
    }

    throw new Error('Firebase Admin credentials not found')
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error)
    throw error
  }
}

/**
 * Get Auth instance (lazy)
 */
export function getAdminAuth(): Auth {
  if (!adminAuthInstance) {
    const app = initAdmin()
    adminAuthInstance = getAuth(app)
  }
  return adminAuthInstance
}

export default initAdmin
