"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { setDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { encode } from "ngeohash"

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

export default function AdminCreateProfiles() {
  const [creating, setCreating] = useState(false)
  const [progress, setProgress] = useState("")
  const [done, setDone] = useState(false)

  const createProfiles = async () => {
    setCreating(true)
    setProgress("Starting...")

    try {
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
        setProgress(`Created ${i + 1}/${dummyProfiles.length}: ${profile.name}`)
        
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      setProgress("Done! All profiles created!")
      setDone(true)
      
    } catch (error: any) {
      setProgress(`Error: ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-6 rounded-xl shadow-2xl max-w-sm z-50">
      <h3 className="text-xl font-bold mb-4">Admin Panel</h3>
      
      {!done ? (
        <>
          <p className="text-sm text-white/60 mb-4">
            Create {dummyProfiles.length} dummy profiles
          </p>
          
          {progress && (
            <div className="mb-4 p-3 bg-emerald-500/20 rounded text-sm">
              {progress}
            </div>
          )}
          
          <Button
            onClick={createProfiles}
            disabled={creating}
            className="w-full bg-emerald-500 hover:bg-emerald-600"
          >
            {creating ? "Creating..." : "Create Profiles"}
          </Button>
        </>
      ) : (
        <div className="text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-emerald-400 font-bold">All Done!</p>
          <p className="text-sm text-white/60 mt-2">Refresh the app to see profiles</p>
        </div>
      )}
    </div>
  )
}