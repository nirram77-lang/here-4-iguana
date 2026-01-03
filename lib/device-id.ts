/**
 * 🆔 I4IGUANA Device ID Service v2.8.4
 * 
 * Generates and manages unique device IDs for security.
 * Used to ensure phone verification is required on new devices,
 * even if the user has previously verified on another device.
 * 
 * This prevents account sharing and improves security.
 */

const DEVICE_ID_KEY = 'i4iguana_device_id'

/**
 * Get or create a unique device ID for this browser/device
 * The ID is stored in localStorage and persists across sessions
 */
export const getOrCreateDeviceId = (): string => {
  // Check if we're in browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    console.log('🆔 Server-side render - returning temp device ID')
    return 'server_side_temp'
  }
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  
  if (!deviceId) {
    // Generate a unique device ID using crypto + timestamp
    const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36)
    
    deviceId = `dev_${randomPart}`
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
    console.log('🆔 Generated new device ID:', deviceId.slice(0, 15) + '...')
  }
  
  return deviceId
}

/**
 * Clear the device ID (used when user explicitly logs out)
 */
export const clearDeviceId = (): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(DEVICE_ID_KEY)
    console.log('🆔 Device ID cleared')
  }
}

/**
 * Check if a device ID exists
 */
export const hasDeviceId = (): boolean => {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(DEVICE_ID_KEY) !== null
}
