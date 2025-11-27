// app/api/create-profiles/route.ts
import { NextResponse } from 'next/server'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

function encodeGeohash(lat: number, lng: number, precision: number = 6): string {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'
  let geohash = ''
  let bits = 0
  let bitsTotal = 0
  let latMin = -90, latMax = 90
  let lngMin = -180, lngMax = 180
  
  while (geohash.length < precision) {
    if (bitsTotal % 2 === 0) {
      const mid = (lngMin + lngMax) / 2
      if (lng > mid) {
        bits = (bits << 1) | 1
        lngMin = mid
      } else {
        bits = bits << 1
        lngMax = mid
      }
    } else {
      const mid = (latMin + latMax) / 2
      if (lat > mid) {
        bits = (bits << 1) | 1
        latMin = mid
      } else {
        bits = bits << 1
        latMax = mid
      }
    }
    bitsTotal++
    if (bitsTotal % 5 === 0) {
      geohash += BASE32[bits]
      bits = 0
    }
  }
  return geohash
}

function getRandomLocation(centerLat: number, centerLng: number, minMeters: number = 10, maxMeters: number = 100) {
  const radiusMeters = minMeters + Math.random() * (maxMeters - minMeters)
  const angle = Math.random() * 2 * Math.PI
  const radiusDegrees = radiusMeters / 111000
  const deltaLat = radiusDegrees * Math.cos(angle)
  const deltaLng = radiusDegrees * Math.sin(angle) / Math.cos(centerLat * Math.PI / 180)
  
  return {
    latitude: centerLat + deltaLat,
    longitude: centerLng + deltaLng
  }
}

export async function POST(request: Request) {
  try {
    const { latitude, longitude, count = 100 } = await request.json()
    
    console.log(`🦎 Creating ${count} profiles near ${latitude}, ${longitude}`)
    
    const names = ["שרה", "רחל", "לאה", "מיכל", "דנה", "נועה", "תמר", "רונית", "מיה", "עדן", "Sarah", "Emma", "Sophia", "Olivia", "Ava", "Isabella", "Mia", "Charlotte", "Amelia", "Harper"]
    const hobbies = ["Yoga", "Reading", "Travel", "Photography", "Cooking", "Dancing", "Music", "Fitness", "Art", "Movies", "Coffee", "Wine"]
    const bios = ["Coffee lover ☕ | Adventure seeker 🌍", "Life is short, make it sweet 🍰", "Living my best life 💫", "Yoga instructor | Plant mom 🌱", "Travel addict ✈️ | Food lover 🍕"]
    
    let created = 0
    
    for (let i = 0; i < count; i++) {
      const loc = getRandomLocation(latitude, longitude, 10, 100)
      const geohash = encodeGeohash(loc.latitude, loc.longitude, 6)
      const age = 21 + Math.floor(Math.random() * 15)
      const name = names[Math.floor(Math.random() * names.length)]
      const numHobbies = 3 + Math.floor(Math.random() * 4)
      const userHobbies = [...hobbies].sort(() => Math.random() - 0.5).slice(0, numHobbies)
      const bio = bios[Math.floor(Math.random() * bios.length)]
      const numPhotos = 1 + Math.floor(Math.random() * 3)
      const photos = Array.from({ length: numPhotos }, (_, idx) => `https://i.pravatar.cc/800?img=${(i * 10 + idx) % 70 + 1}`)
      
      const profile = {
        uid: `dummy_${Date.now()}_${i}`,
        email: `dummy${i}@example.com`,
        displayName: name,
        name: name,
        age: age,
        gender: 'female',
        lookingFor: 'male',
        photos: photos,
        photoURL: photos[0],
        hobbies: userHobbies,
        bio: bio,
        location: { latitude: loc.latitude, longitude: loc.longitude, geohash: geohash },
        preferences: { lookingFor: 'male', minDistance: 0, maxDistance: 1000, ageRange: [21, 35] },
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
      
      await setDoc(doc(db, 'users', profile.uid), profile)
      created++
      
      if (created % 10 === 0) {
        console.log(`✅ Created ${created}/${count}`)
      }
      
      if (i % 10 === 9) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    return NextResponse.json({ success: true, created, message: `Successfully created ${created} profiles!` })
    
  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}