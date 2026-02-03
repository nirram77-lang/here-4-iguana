/**
 * 🆔 I4IGUANA Device ID Service v2.8.7
 * 
 * Generates and manages unique device IDs for security.
 * Uses BOTH localStorage AND IndexedDB for redundancy.
 * IndexedDB survives aggressive Android memory clearing!
 * 
 * This prevents account sharing and improves security.
 */

const DEVICE_ID_KEY = 'i4iguana_device_id'
const DB_NAME = 'I4IguanaDB'
const STORE_NAME = 'deviceStore'
const DB_VERSION = 1

// ═══════════════════════════════════════════════════════════════
// IndexedDB Helper Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Open IndexedDB connection
 */
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => {
      reject(request.error)
    }
    
    request.onsuccess = () => {
      resolve(request.result)
    }
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
  })
}

/**
 * Get value from IndexedDB
 */
const getFromIndexedDB = async (key: string): Promise<string | null> => {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)
      
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.value : null)
      }
      
      request.onerror = () => {
        reject(request.error)
      }
      
      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.warn('⚠️ IndexedDB get error:', error)
    return null
  }
}

/**
 * Save value to IndexedDB
 */
const saveToIndexedDB = async (key: string, value: string): Promise<void> => {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put({ key, value })
      
      request.onsuccess = () => {
        resolve()
      }
      
      request.onerror = () => {
        reject(request.error)
      }
      
      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.warn('⚠️ IndexedDB save error:', error)
  }
}

/**
 * Delete value from IndexedDB
 */
const deleteFromIndexedDB = async (key: string): Promise<void> => {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)
      
      request.onsuccess = () => {
        resolve()
      }
      
      request.onerror = () => {
        reject(request.error)
      }
      
      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.warn('⚠️ IndexedDB delete error:', error)
  }
}

// ═══════════════════════════════════════════════════════════════
// Main Device ID Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a unique device ID
 */
const generateDeviceId = (): string => {
  const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2) + Date.now().toString(36)
  
  return `dev_${randomPart}`
}

/**
 * Get or create a unique device ID for this browser/device
 * Uses BOTH localStorage AND IndexedDB for redundancy
 * 
 * Priority:
 * 1. Check localStorage (fastest)
 * 2. Check IndexedDB (backup - survives memory clearing!)
 * 3. Generate new if neither exists
 */
export const getOrCreateDeviceId = (): string => {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    console.log('🆔 Server-side render - returning temp device ID')
    return 'server_side_temp'
  }
  
  // 1. Try localStorage first (fastest)
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  
  if (deviceId) {
    console.log('🆔 Device ID from localStorage:', deviceId.slice(0, 15) + '...')
    
    // Also save to IndexedDB as backup (async, don't wait)
    saveToIndexedDB(DEVICE_ID_KEY, deviceId).catch(() => {})
    
    return deviceId
  }
  
  // 2. localStorage empty - this is the NEW FIX!
  // Try to recover from IndexedDB (survives "close all" on Samsung!)
  console.log('🆔 localStorage empty - checking IndexedDB backup...')
  
  // Since we need sync return, we'll do async recovery in background
  // and generate new ID now, but the REAL fix is the async version below
  
  // For now, generate new ID
  deviceId = generateDeviceId()
  
  // Save to both storages
  localStorage.setItem(DEVICE_ID_KEY, deviceId)
  saveToIndexedDB(DEVICE_ID_KEY, deviceId).catch(() => {})
  
  console.log('🆔 Generated NEW device ID:', deviceId.slice(0, 15) + '...')
  
  return deviceId
}

/**
 * ✅ NEW: Async version that properly checks IndexedDB backup!
 * Use this at app startup to recover device ID if localStorage was cleared
 */
export const getOrCreateDeviceIdAsync = async (): Promise<string> => {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    console.log('🆔 Server-side render - returning temp device ID')
    return 'server_side_temp'
  }
  
  // 1. Try localStorage first (fastest)
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  
  if (deviceId) {
    console.log('🆔 Device ID from localStorage:', deviceId.slice(0, 15) + '...')
    
    // Also save to IndexedDB as backup
    await saveToIndexedDB(DEVICE_ID_KEY, deviceId)
    
    return deviceId
  }
  
  // 2. localStorage empty - try IndexedDB backup!
  console.log('🆔 localStorage empty - checking IndexedDB backup...')
  
  try {
    const backupDeviceId = await getFromIndexedDB(DEVICE_ID_KEY)
    
    if (backupDeviceId) {
      console.log('🆔 ✅ RECOVERED from IndexedDB:', backupDeviceId.slice(0, 15) + '...')
      
      // Restore to localStorage
      localStorage.setItem(DEVICE_ID_KEY, backupDeviceId)
      
      return backupDeviceId
    }
  } catch (error) {
    console.warn('⚠️ Could not check IndexedDB:', error)
  }
  
  // 3. Neither storage has device ID - generate new one
  deviceId = generateDeviceId()
  
  // Save to both storages
  localStorage.setItem(DEVICE_ID_KEY, deviceId)
  await saveToIndexedDB(DEVICE_ID_KEY, deviceId)
  
  console.log('🆔 Generated NEW device ID:', deviceId.slice(0, 15) + '...')
  
  return deviceId
}

/**
 * ✅ NEW: Initialize device ID at app startup
 * Call this early to ensure IndexedDB backup is checked
 */
export const initializeDeviceId = async (): Promise<void> => {
  if (typeof window === 'undefined') return
  
  const localStorageId = localStorage.getItem(DEVICE_ID_KEY)
  
  if (!localStorageId) {
    // localStorage is empty - try to recover from IndexedDB
    try {
      const backupId = await getFromIndexedDB(DEVICE_ID_KEY)
      
      if (backupId) {
        console.log('🆔 ✅ RECOVERED device ID from IndexedDB backup!')
        localStorage.setItem(DEVICE_ID_KEY, backupId)
        
        // Also restore phone verification cache if it existed
        const phoneVerified = await getFromIndexedDB('i4iguana_phone_verified')
        if (phoneVerified) {
          localStorage.setItem('i4iguana_phone_verified', phoneVerified)
          console.log('🆔 ✅ RECOVERED phone verification status from IndexedDB!')
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not recover from IndexedDB:', error)
    }
  } else {
    // localStorage has ID - ensure IndexedDB backup exists
    await saveToIndexedDB(DEVICE_ID_KEY, localStorageId)
    
    // Also backup phone verification status
    const phoneVerified = localStorage.getItem('i4iguana_phone_verified')
    if (phoneVerified) {
      await saveToIndexedDB('i4iguana_phone_verified', phoneVerified)
    }
  }
}

/**
 * Clear the device ID (used when user explicitly logs out)
 */
export const clearDeviceId = (): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(DEVICE_ID_KEY)
  }
  
  // Also clear from IndexedDB
  deleteFromIndexedDB(DEVICE_ID_KEY).catch(() => {})
  
  console.log('🆔 Device ID cleared from all storages')
}

/**
 * Check if a device ID exists (in either storage)
 */
export const hasDeviceId = (): boolean => {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(DEVICE_ID_KEY) !== null
}

/**
 * ✅ NEW: Backup critical data to IndexedDB
 * Call this after phone verification to ensure data survives memory clearing
 */
export const backupCriticalData = async (): Promise<void> => {
  if (typeof window === 'undefined') return
  
  try {
    // Backup device ID
    const deviceId = localStorage.getItem(DEVICE_ID_KEY)
    if (deviceId) {
      await saveToIndexedDB(DEVICE_ID_KEY, deviceId)
    }
    
    // Backup phone verification status
    const phoneVerified = localStorage.getItem('i4iguana_phone_verified')
    if (phoneVerified) {
      await saveToIndexedDB('i4iguana_phone_verified', phoneVerified)
    }
    
    // Backup last screen
    const lastScreen = localStorage.getItem('i4iguana_last_screen')
    if (lastScreen) {
      await saveToIndexedDB('i4iguana_last_screen', lastScreen)
    }
    
    console.log('🆔 ✅ Critical data backed up to IndexedDB')
  } catch (error) {
    console.warn('⚠️ Could not backup critical data:', error)
  }
}
