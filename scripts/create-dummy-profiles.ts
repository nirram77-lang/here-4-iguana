import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
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
const auth = getAuth(app)
const db = getFirestore(app)

const BASE_LAT = 31.6801
const BASE_LON = 34.5866

const dummyProfiles = [
  { name: "Sarah", age: 28, gender: "female", bio: "Love hiking and photography", hobbies: ["Photography", "Hiking", "Travel"] },
  { name: "Emma", age: 25, gender: "female", bio: "Coffee addict and bookworm", hobbies: ["Reading", "Coffee", "Art"] },
  { name: "Isabella", age: 23, gender: "female", bio: "Fitness enthusiast", hobbies: ["Fitness", "Yoga", "Cooking"] },
  { name: "Olivia", age: 27, gender: "female", bio: "Music lover and dancer", hobbies: ["Music", "Dancing", "Movies"] },
  { name: "Sophia", age: 26, gender: "female", bio: "Foodie and traveler", hobbies: ["Travel", "Food", "Photography"] },
  { name: "Mia", age: 24, gender: "female", bio: "Beach lover", hobbies: ["Beach", "Surfing", "Music"] },
  { name: "Charlotte", age: 29, gender: "female", bio: "Dog mom and nature lover", hobbies: ["Dogs", "Nature", "Hiking"] },
  { name: "Amelia", age: 22, gender: "female", bio: "Art and wine enthusiast", hobbies: ["Art", "Wine", "Culture"] },
  { name: "Ava", age: 30, gender: "female", bio: "Yoga instructor", hobbies: ["Yoga", "Meditation", "Health"] },
  { name: "Ella", age: 21, gender: "female", bio: "Student and party lover", hobbies: ["Parties", "Music", "Friends"] }
]

async function createProfiles() {
  try {
    console.log('Signing in with your account...')
    console.log('Enter your email and password:')
    
    // Sign in with YOUR account (nir.ram7@gmail.com)
    const email = 'nir.ram7@gmail.com'
    const password = 'YOUR_PASSWORD_HERE'  // <-- שים את הסיסמה שלך כאן!
    
    await signInWithEmailAndPassword(auth, email, password)
    console.log('Signed in successfully!')
    
    console.log('\nCreating dummy profiles...')
    
    for (let i = 0; i < dummyProfiles.length; i++) {
      const profile = dummyProfiles[i]
      
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
          `https://i.pravatar.cc/400?img=${i + 10}`,
          `https://i.pravatar.cc/400?img=${i + 30}`
        ],
        photoURL: `https://i.pravatar.cc/400?img=${i + 10}`,
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
      console.log(`✅ Created: ${profile.name}, ${profile.age}`)
      
      // Wait a bit between each profile
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log('\n🎉 Done! Created', dummyProfiles.length, 'profiles')
    console.log('🔄 Refresh your app!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
  
  process.exit(0)
}

createProfiles()