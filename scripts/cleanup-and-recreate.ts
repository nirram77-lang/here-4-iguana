// scripts/cleanup-and-recreate.ts
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore'
import { encode } from 'ngeohash'

const firebaseConfig = {
  apiKey: "AIzaSyA6laY3N84Pe_Fl1769bIoP4NbCxjmqP_o",
  authDomain: "i4iguana-89ed1.firebaseapp.com",
  projectId: "i4iguana-89ed1",
  storageBucket: "i4iguana-89ed1.firebasestorage.app",
  messagingSenderId: "143460198551",
  appId: "1:143460198551:web:5db80d325a549f3e4661d2"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Base location - Rishon LeZion
const BASE_LAT = 31.9730
const BASE_LON = 34.7925

const dummyProfiles = [
  { name: "Sarah", age: 28, gender: "female", bio: "Love hiking and photography", hobbies: ["Photography", "Hiking", "Travel"] },
  { name: "Emma", age: 25, gender: "female", bio: "Coffee addict and bookworm", hobbies: ["Reading", "Coffee", "Art"] },
  { name: "Isabella", age: 23, gender: "female", bio: "Fitness enthusiast", hobbies: ["Fitness", "Yoga", "Cooking"] },
  { name: "Olivia", age: 27, gender: "female", bio: "Music lover and dancer", hobbies: ["Music", "Dancing", "Movies"] },
  { name: "Sophia", age: 26, gender: "female", bio: "Foodie and traveler", hobbies: ["Travel", "Food", "Photography"] },
  { name: "Mia", age: 24, gender: "female", bio: "Beach lover", hobbies: ["Beach", "Surfing", "Music"] },
  { name: "Charlotte", age: 29, gender: "female", bio: "Dog mom and nature lover", hobbies: ["Dogs", "Nature", "Hiking"] },
  { name: "Amelia", age: 22, gender: "female", bio: "Art and wine enthusiast", hobbies: ["Art", "Wine", "Culture"] },
  { name: "שרה", age: 27, gender: "female", bio: "אוהבת לטייל ולצלם", hobbies: ["צילום", "טיולים", "אומנות"] },
  { name: "רחל", age: 25, gender: "female", bio: "חובבת ספרים וקפה", hobbies: ["קריאה", "קפה", "סרטים"] }
]

async function cleanupAndRecreate() {
  try {
    console.log('🧹 Starting cleanup...')
    
    // Get all users
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    
    let deletedCount = 0
    let keptRealUsers = 0
    
    // Delete all dummy profiles (keep only real users)
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      
      // Keep real users (those with real emails)
      if (data.email && !data.email.includes('test') && !data.email.includes('dummy')) {
        console.log(`✅ Keeping real user: ${data.email}`)
        keptRealUsers++
        continue
      }
      
      // Delete dummy profiles
      console.log(`🗑️ Deleting: ${data.name || 'Unknown'} (${data.email || 'no email'})`)
      await deleteDoc(doc(db, 'users', docSnap.id))
      deletedCount++
    }
    
    console.log(`✅ Deleted ${deletedCount} dummy profiles`)
    console.log(`✅ Kept ${keptRealUsers} real users`)
    
    console.log('\n🎨 Creating new dummy profiles...')
    
    // Create new dummy profiles
    for (let i = 0; i < dummyProfiles.length; i++) {
      const profile = dummyProfiles[i]
      
      // Generate random location near base location (within 1km)
      const latOffset = (Math.random() - 0.5) * 0.02
      const lonOffset = (Math.random() - 0.5) * 0.02
      const latitude = BASE_LAT + latOffset
      const longitude = BASE_LON + lonOffset
      const geohash = encode(latitude, longitude)
      
      const userId = `dummy_${Date.now()}_${i}`
      const email = `dummy_${Date.now()}_${i}@test.com`
      
      const userData = {
        uid: userId,
        email: email,
        displayName: profile.name,
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        lookingFor: "male",
        photos: [
          `https://i.pravatar.cc/400?img=${i + 1}`,
          `https://i.pravatar.cc/400?img=${i + 20}`
        ],
        photoURL: `https://i.pravatar.cc/400?img=${i + 1}`,
        hobbies: profile.hobbies,
        bio: profile.bio,
        location: {
          latitude,
          longitude,
          geohash
        },
        preferences: {
          lookingFor: "male",
          minDistance: 0,
          maxDistance: 50,
          ageRange: [21, 35]
        },
        swipedRight: [],
        swipedLeft: [],
        matches: [],
        passesLeft: 1,
        isPremium: false,
        lastResetDate: new Date().toISOString(),
        onboardingComplete: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await setDoc(doc(db, 'users', userId), userData)
      console.log(`✅ Created: ${profile.name}, ${profile.age} at (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`)
    }
    
    console.log('\n🎉 Done! Created', dummyProfiles.length, 'new dummy profiles')
    console.log('🔄 Please refresh your app!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
  
  process.exit(0)
}

cleanupAndRecreate()