import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth'
import { 
  doc, 
  setDoc, 
  getDoc, 
  Timestamp 
} from 'firebase/firestore'
import { auth, db } from './firebase'

export type AdminRole = 'super' | 'venue'

export interface AdminUser {
  uid: string
  email: string
  role: AdminRole
  venueId?: string  // Only for venue admins
  venueName?: string  // Only for venue admins
  createdAt: Timestamp
  lastLogin: Timestamp
  active: boolean
}

/**
 * Create admin user account
 */
export async function createAdminAccount(
  email: string,
  password: string,
  role: AdminRole,
  venueId?: string,
  venueName?: string
): Promise<AdminUser> {
  try {
    console.log('👤 Creating admin account:', email, role)
    
    // Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Create admin document
    const adminData: AdminUser = {
      uid: user.uid,
      email: user.email!,
      role,
      venueId: role === 'venue' ? venueId : undefined,
      venueName: role === 'venue' ? venueName : undefined,
      createdAt: Timestamp.now(),
      lastLogin: Timestamp.now(),
      active: true
    }
    
    // Save to appropriate collection
    const collection = role === 'super' ? 'superAdmins' : 'venueAdmins'
    await setDoc(doc(db, collection, user.uid), adminData)
    
    console.log('✅ Admin account created:', email)
    
    return adminData
  } catch (error: any) {
    console.error('❌ Error creating admin account:', error)
    
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email already in use')
    }
    if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak (min 6 characters)')
    }
    
    throw new Error('Failed to create admin account')
  }
}

/**
 * Admin login
 */
export async function adminLogin(
  email: string,
  password: string
): Promise<{ user: User; adminData: AdminUser }> {
  try {
    console.log('🔐 Admin login attempt:', email)
    
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Check if user is admin
    const adminData = await getAdminData(user.uid)
    
    if (!adminData) {
      // Not an admin - sign out immediately
      await signOut(auth)
      throw new Error('Unauthorized: Not an admin account')
    }
    
    if (!adminData.active) {
      await signOut(auth)
      throw new Error('Account is deactivated')
    }
    
    // Update last login
    const collection = adminData.role === 'super' ? 'superAdmins' : 'venueAdmins'
    await setDoc(
      doc(db, collection, user.uid),
      { lastLogin: Timestamp.now() },
      { merge: true }
    )
    
    console.log('✅ Admin login successful:', email, adminData.role)
    
    return { user, adminData }
  } catch (error: any) {
    console.error('❌ Admin login error:', error)
    
    if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      throw new Error('Invalid email or password')
    }
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Try again later.')
    }
    
    throw error
  }
}

/**
 * Admin logout
 */
export async function adminLogout(): Promise<void> {
  try {
    await signOut(auth)
    console.log('✅ Admin logged out')
  } catch (error) {
    console.error('❌ Logout error:', error)
    throw new Error('Failed to logout')
  }
}

/**
 * Get admin data
 */
export async function getAdminData(uid: string): Promise<AdminUser | null> {
  try {
    // Check super admins first
    const superAdminDoc = await getDoc(doc(db, 'superAdmins', uid))
    if (superAdminDoc.exists()) {
      return superAdminDoc.data() as AdminUser
    }
    
    // Check venue admins
    const venueAdminDoc = await getDoc(doc(db, 'venueAdmins', uid))
    if (venueAdminDoc.exists()) {
      return venueAdminDoc.data() as AdminUser
    }
    
    return null
  } catch (error) {
    console.error('❌ Error getting admin data:', error)
    return null
  }
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(uid: string): Promise<boolean> {
  try {
    const adminData = await getAdminData(uid)
    return adminData?.role === 'super' && adminData.active
  } catch (error) {
    console.error('❌ Error checking super admin:', error)
    return false
  }
}

/**
 * Check if user is venue admin
 */
export async function isVenueAdmin(uid: string): Promise<boolean> {
  try {
    const adminData = await getAdminData(uid)
    return adminData?.role === 'venue' && adminData.active
  } catch (error) {
    console.error('❌ Error checking venue admin:', error)
    return false
  }
}

/**
 * Get venue admin's venue ID
 */
export async function getVenueAdminVenueId(uid: string): Promise<string | null> {
  try {
    const adminData = await getAdminData(uid)
    if (adminData?.role !== 'venue') return null
    return adminData.venueId || null
  } catch (error) {
    console.error('❌ Error getting venue ID:', error)
    return null
  }
}

/**
 * Deactivate admin account
 */
export async function deactivateAdmin(uid: string): Promise<void> {
  try {
    const adminData = await getAdminData(uid)
    if (!adminData) {
      throw new Error('Admin not found')
    }
    
    const collection = adminData.role === 'super' ? 'superAdmins' : 'venueAdmins'
    await setDoc(
      doc(db, collection, uid),
      { active: false },
      { merge: true }
    )
    
    console.log('✅ Admin deactivated:', uid)
  } catch (error) {
    console.error('❌ Error deactivating admin:', error)
    throw new Error('Failed to deactivate admin')
  }
}

/**
 * Reactivate admin account
 */
export async function reactivateAdmin(uid: string): Promise<void> {
  try {
    const adminData = await getAdminData(uid)
    if (!adminData) {
      throw new Error('Admin not found')
    }
    
    const collection = adminData.role === 'super' ? 'superAdmins' : 'venueAdmins'
    await setDoc(
      doc(db, collection, uid),
      { active: true },
      { merge: true }
    )
    
    console.log('✅ Admin reactivated:', uid)
  } catch (error) {
    console.error('❌ Error reactivating admin:', error)
    throw new Error('Failed to reactivate admin')
  }
}

/**
 * Generate random password
 */
export function generateRandomPassword(length: number = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return password
}
