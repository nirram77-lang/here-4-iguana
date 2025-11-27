import { collection, addDoc, setDoc, doc } from "firebase/firestore"
import { db } from "./firebase"
import { encodeGeohash } from "./location-service"

// Female names in Hebrew/English
const femaleNames = [
  "שרה", "רחל", "לאה", "מיכל", "דנה", "נועה", "תמר", "רונית", "מיה", "עדן",
  "יעל", "אורי", "לירון", "שירה", "מור", "ליאור", "איריס", "רוני", "שני", "דקלה",
  "Sarah", "Emma", "Sophia", "Olivia", "Ava", "Isabella", "Mia", "Charlotte", "Amelia", "Harper",
  "Evelyn", "Abigail", "Emily", "Elizabeth", "Sofia", "Avery", "Ella", "Scarlett", "Grace", "Chloe",
  "Victoria", "Riley", "Aria", "Lily", "Aubrey", "Zoey", "Penelope", "Lillian", "Addison", "Layla",
  "Natalie", "Camila", "Hannah", "Brooklyn", "Zoe", "Nora", "Leah", "Savannah", "Audrey", "Claire",
  "Eleanor", "Skylar", "Ellie", "Samantha", "Stella", "Paisley", "Violet", "Mila", "Allison", "Alexa",
  "Anna", "Hazel", "Aaliyah", "Ariana", "Lucy", "Caroline", "Sarah", "Genesis", "Kennedy", "Sadie",
  "Gabriella", "Madelyn", "Adeline", "Maya", "Autumn", "Aurora", "Piper", "Hailey", "Arianna", "Kaylee",
  "Ruby", "Serenity", "Eva", "Naomi", "Nevaeh", "Alice", "Luna", "Bella", "Quinn", "Lydia"
]

// Hobbies
const hobbies = [
  "Yoga", "Reading", "Travel", "Photography", "Cooking", "Dancing", "Music", "Fitness",
  "Art", "Movies", "Coffee", "Wine", "Fashion", "Gaming", "Hiking", "Swimming",
  "Running", "Cycling", "Meditation", "Painting", "Writing", "Singing", "Shopping",
  "Beach", "Nature", "Pets", "Concerts", "Theater", "Foodie", "Netflix"
]

// Bios
const bios = [
  "Coffee lover ☕ | Adventure seeker 🌍",
  "Life is short, make it sweet 🍰",
  "Living my best life 💫",
  "Yoga instructor | Plant mom 🌱",
  "Travel addict ✈️ | Food lover 🍕",
  "Dancing through life 💃",
  "Beach bum 🏖️ | Sunset chaser 🌅",
  "Book worm 📚 | Coffee addict ☕",
  "Fitness enthusiast 💪 | Healthy living",
  "Artist at heart 🎨 | Creative soul",
  "Music lover 🎵 | Concert junkie",
  "Foodie | Chef wannabe 👩‍🍳",
  "Dog mom 🐕 | Animal lover",
  "Fashionista 👗 | Style icon",
  "Photographer 📸 | Capturing moments",
  "Wine lover 🍷 | Cheese enthusiast",
  "Adventurer | Risk taker 🚀",
  "Meditation & mindfulness 🧘‍♀️",
  "Runner 🏃‍♀️ | Marathon training",
  "Ocean lover 🌊 | Mermaid vibes",
  "Netflix & chill 📺",
  "Traveler | 50 countries and counting ✈️",
  "Vegan 🌱 | Sustainability advocate",
  "Entrepreneur | Boss babe 💼",
  "Teacher | Making a difference 📚",
  "Nurse | Helping others ❤️",
  "Designer | Creative mind 🎨",
  "Writer ✍️ | Storyteller",
  "Actress | Drama queen 🎭",
  "Singer 🎤 | Music is life"
]

// Random profile image URLs (using placeholder service)
const getRandomPhoto = (index: number) => {
  // Using diverse placeholder images
  const seed = Math.floor(Math.random() * 10000)
  return `https://i.pravatar.cc/800?img=${(index % 70) + 1}`
}

/**
 * Generate random location within radius
 * @param centerLat - Center latitude
 * @param centerLng - Center longitude
 * @param minRadiusMeters - Minimum radius in meters
 * @param maxRadiusMeters - Maximum radius in meters
 */
function getRandomLocation(
  centerLat: number,
  centerLng: number,
  minRadiusMeters: number = 10,
  maxRadiusMeters: number = 100
) {
  // Random distance between min and max
  const radiusMeters = minRadiusMeters + Math.random() * (maxRadiusMeters - minRadiusMeters)
  
  // Random angle
  const angle = Math.random() * 2 * Math.PI
  
  // Convert meters to degrees (approximately)
  // 1 degree latitude ≈ 111km
  // 1 degree longitude ≈ 111km * cos(latitude)
  const radiusDegrees = radiusMeters / 111000
  
  const deltaLat = radiusDegrees * Math.cos(angle)
  const deltaLng = radiusDegrees * Math.sin(angle) / Math.cos(centerLat * Math.PI / 180)
  
  return {
    latitude: centerLat + deltaLat,
    longitude: centerLng + deltaLng
  }
}

/**
 * Create dummy female profiles
 */
export async function createDummyProfiles(
  centerLatitude: number,
  centerLongitude: number,
  count: number = 100
) {
  console.log(`🚀 Creating ${count} dummy profiles...`)
  
  const profiles = []
  
  for (let i = 0; i < count; i++) {
    // Random location within 10-100 meters
    const location = getRandomLocation(centerLatitude, centerLongitude, 10, 100)
    const geohash = encodeGeohash(location.latitude, location.longitude, 6)
    
    // Random age between 21-35
    const age = 21 + Math.floor(Math.random() * 15)
    
    // Random name
    const name = femaleNames[Math.floor(Math.random() * femaleNames.length)]
    
    // Random 3-6 hobbies
    const numHobbies = 3 + Math.floor(Math.random() * 4)
    const shuffledHobbies = [...hobbies].sort(() => Math.random() - 0.5)
    const userHobbies = shuffledHobbies.slice(0, numHobbies)
    
    // Random bio
    const bio = bios[Math.floor(Math.random() * bios.length)]
    
    // 1-3 photos
    const numPhotos = 1 + Math.floor(Math.random() * 3)
    const photos = Array.from({ length: numPhotos }, (_, idx) => getRandomPhoto(i * 10 + idx))
    
    const profile = {
      uid: `dummy_${Date.now()}_${i}`,
      email: `dummy${i}@example.com`,
      displayName: name,
      name: name,
      age: age,
      gender: 'female' as const,
      lookingFor: 'male' as const,
      photos: photos,
      photoURL: photos[0],
      hobbies: userHobbies,
      bio: bio,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        geohash: geohash
      },
      preferences: {
        lookingFor: 'male',
        minDistance: 0,
        maxDistance: 1000,
        ageRange: [21, 35]
      },
      swipedRight: [],
      swipedLeft: [],
      matches: [],
      passesLeft: 1,
      isPremium: false,
      lastResetDate: new Date().toDateString(),
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    profiles.push(profile)
  }
  
  // Add to Firestore in batches of 10
  let added = 0
  const batchSize = 10
  
  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize)
    
    await Promise.all(
      batch.map(async (profile) => {
        try {
          await setDoc(doc(db, 'users', profile.uid), profile)
          added++
          console.log(`✅ Added profile ${added}/${count}: ${profile.name}, ${profile.age}`)
        } catch (error) {
          console.error(`❌ Error adding profile ${profile.name}:`, error)
        }
      })
    )
    
    // Small delay between batches to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log(`🎉 Successfully created ${added}/${count} dummy profiles!`)
  return added
}

/**
 * Delete all dummy profiles
 */
export async function deleteDummyProfiles() {
  console.log('🗑️ Deleting dummy profiles...')
  // This would require Firebase Admin SDK
  // For now, you can delete them manually from Firebase Console
  console.log('⚠️ Please delete dummy profiles from Firebase Console')
  console.log('Filter by uid starting with "dummy_"')
}
