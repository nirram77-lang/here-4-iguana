"use client"

import { useState, useEffect, useCallback } from "react"
import SplashScreen from "@/components/splash-screen"
import WelcomeScreen from "@/components/welcome-screen"
import LoginScreen from "@/components/login-screen"
import OnboardingGender from "@/components/onboarding-gender"
import OnboardingAge from "@/components/onboarding-age"
import OnboardingHobbies from "@/components/onboarding-hobbies"
import OnboardingPhotos from "@/components/onboarding-photos"
import HomeScreen from "@/components/home-screen"
import MatchScreen from "@/components/match-screen"
import NotificationsScreen from "@/components/notifications-screen"
import ProfileScreen from "@/components/profile-screen"
import ChatScreen from "@/components/chat-screen"
import { useAuth } from "@/lib/AuthContext"
import { saveOnboardingData } from "@/lib/onboarding-service"
import { getUserProfile, findNearbyUsers, updateUserLocation } from "@/lib/firestore-service"
import { getCurrentLocation } from "@/lib/location-service"
import { getUserPassData, usePass } from "@/lib/pass-system"

type Screen = "splash" | "welcome" | "login" | "signup" | "onboarding-gender" | "onboarding-age" | "onboarding-hobbies" | "onboarding-photos" | "home" | "match" | "notifications" | "profile" | "chat"

export default function Page() {
  const { user } = useAuth()
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash")
  const [matchedUser, setMatchedUser] = useState<any>(null)
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [currentMatchId, setCurrentMatchId] = useState<string>("")
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showOutOfPasses, setShowOutOfPasses] = useState(false)

  // Pass system state
  const [passesLeft, setPassesLeft] = useState(1)
  const [isPremium, setIsPremium] = useState(false)
  const [matchesCountToday, setMatchesCountToday] = useState(0)
  const [isLockedInMatch, setIsLockedInMatch] = useState(false)
  
  // Global timer
  const [timeRemaining, setTimeRemaining] = useState(600)

  const [onboardingData, setOnboardingData] = useState({
    gender: 'male' as 'male' | 'female',
    lookingFor: 'female' as 'male' | 'female' | 'both',
    age: 25,
    ageRange: [21, 35] as [number, number],
    hobbies: [] as string[],
    photos: [] as string[],
    bio: '',
    name: '',
  })

  // ✅ IMPROVED CHECK PROFILE AFTER LOGIN - with retry logic
  const handleLoginComplete = async () => {
    if (!user) {
      console.log('⚠️ No user found after login')
      return
    }

    console.log('🔍 Checking profile for user:', user.uid)

    // Retry logic for Firestore
    let retries = 3
    let profile = null
    
    while (retries > 0 && !profile) {
      try {
        // Give Firestore a moment to sync (more time on first try)
        await new Promise(resolve => setTimeout(resolve, retries === 3 ? 1000 : 500))
        
        profile = await getUserProfile(user.uid)
        
        if (profile) {
          console.log('✅ Profile found:', profile)
          break
        }
      } catch (error: any) {
        console.error(`❌ Error getting profile (${4 - retries}/3):`, error?.message || error)
        
        // If it's a permissions error, check if we need to wait longer
        if (error?.code === 'permission-denied') {
          console.log('⚠️ Permission denied - waiting longer...')
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        retries--
        
        // If this was the last retry and still failing, treat as new user
        if (retries === 0) {
          console.log('❌ Failed to get profile after 3 retries - treating as NEW USER')
          profile = null
        }
      }
    }
    
    // Determine if user is new or existing
    if (!profile) {
      console.log('🆕 No profile found - NEW USER - going to onboarding')
      setCurrentScreen("onboarding-gender")
      return
    }

    // Check if profile is complete
    const hasCompletedOnboarding = profile.onboardingComplete === true
    const hasBasicProfile = profile.photos && 
      profile.photos.length > 0 && 
      (profile.name || profile.displayName)
    
    if (hasCompletedOnboarding || hasBasicProfile) {
      console.log('✅ User has complete profile - EXISTING USER - going to home')
      console.log('📊 Profile details:', {
        name: profile.name || profile.displayName,
        photos: profile.photos?.length || 0,
        onboardingComplete: profile.onboardingComplete
      })
      setCurrentScreen("home")
    } else {
      console.log('⚠️ Profile incomplete - going to onboarding')
      setCurrentScreen("onboarding-gender")
    }
  }

  // Load pass data
  useEffect(() => {
    const loadPassData = async () => {
      if (user && (currentScreen === "home" || currentScreen === "match")) {
        try {
          const passData = await getUserPassData(user.uid)
          setPassesLeft(passData.passesLeft)
          setIsPremium(passData.isPremium)
          setMatchesCountToday(passData.matchesCountToday)
          console.log(`✅ Data loaded: ${passData.passesLeft} passes, ${passData.matchesCountToday} matches today`)
        } catch (error) {
          console.error('❌ Error loading pass data:', error)
        }
      }
    }
    loadPassData()
  }, [user, currentScreen])

  // Check user profile when arriving at home
  useEffect(() => {
    const checkUserProfile = async () => {
      if (user && currentScreen === "home") {
        try {
          const profile = await getUserProfile(user.uid)
          const hasCompletedOnboarding = profile?.onboardingComplete === true
          const hasOldProfile = profile && profile.photos && profile.photos.length > 0 && (profile.name || profile.displayName)
          
          if (!profile || (!hasCompletedOnboarding && !hasOldProfile)) {
            setCurrentScreen("onboarding-gender")
            return
          }
          await loadNearbyUsers()
        } catch (error) {
          console.error('❌ Error checking user profile:', error)
        }
      }
    }
    checkUserProfile()
  }, [user, currentScreen])

  // Global timer
  useEffect(() => {
    if (!isLockedInMatch || timeRemaining <= 0) return
    
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev > 0 ? prev - 1 : 0
        
        if (newTime === 0) {
          console.log('⏰ Global timer expired!')
          setTimeout(() => {
            setIsLockedInMatch(false)
            setMatchedUser(null)
            setSelectedMatch(null)
            setCurrentMatchId("")
            setTimeRemaining(600)
            setCurrentScreen("home")
          }, 100)
        }
        
        return newTime
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isLockedInMatch, timeRemaining])

  const loadNearbyUsers = async () => {
    if (!user) return
    try {
      setLoading(true)
      const location = await getCurrentLocation()
      await updateUserLocation(user.uid, location.latitude, location.longitude, location.geohash)
      const users = await findNearbyUsers(user.uid, location, 1000, 10)
      setNearbyUsers(users)
    } catch (error) {
      console.error('❌ Error loading nearby users:', error)
      setNearbyUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleMatch = async (matchUser: any) => {
    console.log('🎉 MATCH! Creating match with:', matchUser)
    
    if (user) {
      try {
        // ✅ FIX: Use a pass when creating a match (only for free users)
        if (!isPremium) {
          const newPassCount = await usePass(user.uid)
          setPassesLeft(newPassCount)
          console.log(`🎫 Pass used! ${newPassCount} passes remaining`)
        }
        
        const { incrementMatchCount } = await import('@/lib/pass-system')
        const newMatchCount = await incrementMatchCount(user.uid)
        setMatchesCountToday(newMatchCount)
        console.log(`📊 This is match #${newMatchCount} today`)
      } catch (error) {
        console.error('❌ Error incrementing match count:', error)
      }
    }
    
    setMatchedUser(matchUser)
    setSelectedMatch(matchUser)
    setIsLockedInMatch(true)
    setTimeRemaining(600)
    
    if (user) {
      const matchId = [user.uid, matchUser.uid].sort().join('_')
      setCurrentMatchId(matchId)
    }
    
    setCurrentScreen("match")
  }

  const handleMeetNow = () => {
    let finalMatchId = currentMatchId
    
    if (!finalMatchId && user && matchedUser) {
      const userId = matchedUser.uid || matchedUser.id
      finalMatchId = [user.uid, userId].sort().join('_')
      setCurrentMatchId(finalMatchId)
    }
    
    if (!selectedMatch) {
      setSelectedMatch(matchedUser)
    }
    
    setCurrentScreen("chat")
  }

  const handlePass = async () => {
    if (passesLeft > 0 && user) {
      try {
        const newPassCount = await usePass(user.uid)
        setPassesLeft(newPassCount)
        setIsLockedInMatch(false)
        setMatchedUser(null)
        setSelectedMatch(null)
        setCurrentMatchId("")
        setTimeRemaining(600)
        setCurrentScreen("home")
      } catch (error) {
        console.error('❌ Error using pass:', error)
        if (error instanceof Error && error.message.includes('No passes left')) {
          alert('No passes left for today!')
        }
      }
    }
  }

  const handleMatchTimeout = useCallback(() => {
    console.log('⏰ Match timeout - checking limits')
    console.log(`📊 Matches today: ${matchesCountToday}, Premium: ${isPremium}`)
    
    const maxMatches = isPremium ? 999 : 2
    
    if (matchesCountToday >= maxMatches) {
      console.log('❌ Reached daily match limit - showing out of passes')
      setShowOutOfPasses(true)
    } else {
      console.log('✅ Can continue - still have matches left')
      setCurrentScreen("home")
    }
    
    setIsLockedInMatch(false)
    setMatchedUser(null)
    setSelectedMatch(null)
    setCurrentMatchId("")
    setTimeRemaining(600)
  }, [matchesCountToday, isPremium])

  const handleOnboardingComplete = async (finalData: { photos: string[], bio: string }) => {
    // ✅ name already in onboardingData from Name Entry screen!
    const completeData = { 
      ...onboardingData, 
      ...finalData,
      minDistance: 10, // ✅ Added default minDistance
      maxDistance: 500 // ✅ Added default maxDistance
    }
    if (user) {
      try {
        await saveOnboardingData(user.uid, user.email || '', completeData)
        setCurrentScreen("home")
      } catch (error) {
        console.error('❌ Error saving onboarding data:', error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {currentScreen === "splash" && <SplashScreen onComplete={() => setCurrentScreen("welcome")} />}
      {currentScreen === "welcome" && <WelcomeScreen onLogin={() => setCurrentScreen("login")} onSignUp={() => setCurrentScreen("signup")} />}
      
      {/* ✅ BOTH login and signup use handleLoginComplete to check profile */}
      {currentScreen === "login" && (
        <LoginScreen 
          onSuccess={handleLoginComplete}
          isSignUp={false}
        />
      )}
      {currentScreen === "signup" && (
        <LoginScreen 
          onSuccess={handleLoginComplete}
          isSignUp={true}
        />
      )}
      
      {currentScreen === "onboarding-gender" && <OnboardingGender onNext={(data) => { setOnboardingData({ ...onboardingData, ...data }); setCurrentScreen("onboarding-age") }} />}
      {currentScreen === "onboarding-age" && <OnboardingAge onNext={(data) => { setOnboardingData({ ...onboardingData, ...data }); setCurrentScreen("onboarding-hobbies") }} onBack={() => setCurrentScreen("onboarding-gender")} />}
      {currentScreen === "onboarding-hobbies" && <OnboardingHobbies onNext={(data) => { setOnboardingData({ ...onboardingData, ...data }); setCurrentScreen("onboarding-photos") }} onBack={() => setCurrentScreen("onboarding-age")} />}
      {currentScreen === "onboarding-photos" && <OnboardingPhotos onComplete={handleOnboardingComplete} onBack={() => setCurrentScreen("onboarding-hobbies")} />}
      
      {currentScreen === "home" && (
        <HomeScreen
          onMatch={handleMatch}
          onNavigate={(screen) => setCurrentScreen(screen as Screen)}
          isLocked={isLockedInMatch}
          nearbyUsers={nearbyUsers}
          loading={loading}
          onRefresh={loadNearbyUsers}
          passesLeft={passesLeft}
          isPremium={isPremium}
        />
      )}

      {currentScreen === "match" && matchedUser && (
        <MatchScreen
          user={matchedUser}
          onContinue={handleMatchTimeout}
          onMeetNow={handleMeetNow}
          passesLeft={passesLeft}
          onPass={handlePass}
          isPremium={isPremium}
          timeRemaining={timeRemaining}
        />
      )}

      {currentScreen === "notifications" && (
        <NotificationsScreen 
          onNavigate={(screen) => setCurrentScreen(screen as Screen)} 
        />
      )}
      {currentScreen === "profile" && (
        <ProfileScreen 
          onNavigate={(screen) => setCurrentScreen(screen as Screen)} 
        />
      )}

      {currentScreen === "chat" && user && currentMatchId && selectedMatch && (
        <ChatScreen
          matchId={currentMatchId}
          currentUserId={user.uid}
          otherUserId={selectedMatch.uid || selectedMatch.id}
          matchUser={{
            name: selectedMatch.name || selectedMatch.displayName || 'Unknown',
            photo: selectedMatch.photoURL || selectedMatch.photos?.[0] || '/placeholder.svg',
            distance: selectedMatch.distance ? `${selectedMatch.distance}m` : '0m'
          }}
          timeRemaining={timeRemaining}
          onBack={() => setCurrentScreen("match")}
        />
      )}

      {showOutOfPasses && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-gradient-to-b from-orange-500 to-red-500 rounded-3xl p-8 max-w-md text-center shadow-2xl">
            <div className="text-6xl mb-4">🔥</div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Out of Matches!
            </h2>
            <p className="text-white/80 text-lg mb-2">
              You've had 2 matches today.
            </p>
            <p className="text-white/60 text-sm mb-6">
              Come back tomorrow or upgrade to Premium!
            </p>

            <button onClick={() => setShowOutOfPasses(false)} className="w-full bg-white text-red-600 font-bold py-4 rounded-xl text-lg hover:bg-gray-100 transition-all">
              OK
            </button>
          </div>
        </div>
      )}

      {loading && currentScreen === "home" && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="text-4xl mb-2 animate-bounce">🦎</div>
            <p className="text-gray-700">מחפש משתמשים קרובים...</p>
          </div>
        </div>
      )}
    </div>
  )
}
