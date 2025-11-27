import ngeohash from "ngeohash"
import { LOCATION_CONFIG, ERROR_MESSAGES } from "./constants"

export interface Location {
  latitude: number
  longitude: number
  geohash: string
  accuracy?: number
  timestamp: number
}

/**
 * Encode coordinates to geohash
 * Exported for use in dummy profiles and other utilities
 */
export const encodeGeohash = (
  latitude: number,
  longitude: number,
  precision: number = LOCATION_CONFIG.GEOHASH_PRECISION
): string => {
  return ngeohash.encode(latitude, longitude, precision)
}

/**
 * Get current GPS location with high accuracy
 * Critical for 10m-1km radius matching
 */
export const getCurrentLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error(ERROR_MESSAGES.LOCATION_NOT_SUPPORTED))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords

        // Generate geohash with precision 8 (approx 19m x 19m)
        const geohash = encodeGeohash(latitude, longitude, LOCATION_CONFIG.GEOHASH_PRECISION)

        resolve({
          latitude,
          longitude,
          geohash,
          accuracy,
          timestamp: Date.now(),
        })
      },
      (error) => {
        let errorMessage: string = ERROR_MESSAGES.UNKNOWN_ERROR

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = ERROR_MESSAGES.LOCATION_PERMISSION_DENIED
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = ERROR_MESSAGES.LOCATION_UNAVAILABLE
            break
          case error.TIMEOUT:
            errorMessage = ERROR_MESSAGES.LOCATION_TIMEOUT
            break
        }

        reject(new Error(errorMessage))
      },
      {
        enableHighAccuracy: true,
        timeout: LOCATION_CONFIG.LOCATION_TIMEOUT,
        maximumAge: LOCATION_CONFIG.LOCATION_MAX_AGE,
      }
    )
  })
}

// Throttle state
let lastUpdateTime = 0
let pendingCallback: ((location: Location) => void) | null = null

/**
 * Watch location in real-time with throttling
 * ✅ FIX: Added throttling to prevent too frequent updates
 */
export const watchLocation = (
  onLocationUpdate: (location: Location) => void,
  onError?: (error: GeolocationPositionError) => void
): number => {
  if (!navigator.geolocation) {
    throw new Error(ERROR_MESSAGES.LOCATION_NOT_SUPPORTED)
  }

  // Store the callback
  pendingCallback = onLocationUpdate

  return navigator.geolocation.watchPosition(
    (position) => {
      const now = Date.now()

      // ✅ Throttle: Only update if enough time has passed
      if (now - lastUpdateTime < LOCATION_CONFIG.LOCATION_UPDATE_INTERVAL) {
        console.log('⏸️ Location update throttled')
        return
      }

      lastUpdateTime = now

      const { latitude, longitude, accuracy } = position.coords
      const geohash = encodeGeohash(latitude, longitude, LOCATION_CONFIG.GEOHASH_PRECISION)

      const location: Location = {
        latitude,
        longitude,
        geohash,
        accuracy,
        timestamp: now,
      }

      console.log('📍 Location updated:', location)

      if (pendingCallback) {
        pendingCallback(location)
      }
    },
    (error) => {
      console.error('❌ Location error:', error)
      if (onError) {
        onError(error)
      }
    },
    {
      enableHighAccuracy: true,
      timeout: LOCATION_CONFIG.LOCATION_TIMEOUT,
      maximumAge: LOCATION_CONFIG.LOCATION_MAX_AGE,
    }
  )
}

/**
 * Stop watching location
 */
export const stopWatchingLocation = (watchId: number): void => {
  navigator.geolocation.clearWatch(watchId)
  pendingCallback = null
  lastUpdateTime = 0
  console.log('🛑 Location watch stopped')
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Get geohash neighbors for proximity search
 */
export const getGeohashNeighbors = (geohash: string): string[] => {
  const neighbors = []
  
  // Get all 8 neighbors (top, bottom, left, right, and 4 diagonals)
  try {
    neighbors.push(ngeohash.neighbor(geohash, [0, 1]))   // top
    neighbors.push(ngeohash.neighbor(geohash, [0, -1]))  // bottom
    neighbors.push(ngeohash.neighbor(geohash, [1, 0]))   // right
    neighbors.push(ngeohash.neighbor(geohash, [-1, 0]))  // left
    neighbors.push(ngeohash.neighbor(geohash, [1, 1]))   // top-right
    neighbors.push(ngeohash.neighbor(geohash, [1, -1]))  // bottom-right
    neighbors.push(ngeohash.neighbor(geohash, [-1, 1]))  // top-left
    neighbors.push(ngeohash.neighbor(geohash, [-1, -1])) // bottom-left
  } catch (error) {
    console.warn('Error getting geohash neighbors:', error)
  }
  
  return [geohash, ...neighbors]
}

/**
 * Format distance for display
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

/**
 * Check if location is valid
 */
export const isValidLocation = (location: Location): boolean => {
  return (
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180 &&
    location.geohash.length > 0
  )
}