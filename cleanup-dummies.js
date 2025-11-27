// cleanup-dummies.js
// Run this: node cleanup-dummies.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc, setDoc, Timestamp } = require('firebase/firestore');

// Your Firebase config (from your project)
const firebaseConfig = {
  apiKey: "AIzaSyA6IaY3N84Pe_FIl769bIoP4NbCxImqP_o",
  authDomain: "i4iguana-89ed1.firebaseapp.com",
  projectId: "i4iguana-89ed1",
  storageBucket: "i4iguana-89ed1.firebasestorage.app",
  messagingSenderId: "143460198551",
  appId: "1:143460198551:web:5db80d325a549f3e4661d2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper: Calculate simple geohash
function calculateGeohash(lat, lng) {
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let geohash = '';
  let latRange = [-90, 90];
  let lngRange = [-180, 180];
  let isEven = true;
  let bit = 0;
  let ch = 0;
  
  while (geohash.length < 6) {
    if (isEven) {
      const mid = (lngRange[0] + lngRange[1]) / 2;
      if (lng > mid) {
        ch |= (1 << (4 - bit));
        lngRange[0] = mid;
      } else {
        lngRange[1] = mid;
      }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat > mid) {
        ch |= (1 << (4 - bit));
        latRange[0] = mid;
      } else {
        latRange[1] = mid;
      }
    }
    
    isEven = !isEven;
    
    if (bit < 4) {
      bit++;
    } else {
      geohash += base32[ch];
      bit = 0;
      ch = 0;
    }
  }
  
  return geohash;
}

// Helper: Generate location near base
function generateNearbyLocation(baseLat, baseLng, distanceMeters) {
  const latOffset = (distanceMeters / 111000) * (Math.random() * 2 - 1);
  const lngOffset = (distanceMeters / (111000 * Math.cos(baseLat * Math.PI / 180))) * (Math.random() * 2 - 1);
  
  return {
    latitude: baseLat + latOffset,
    longitude: baseLng + lngOffset
  };
}

async function cleanup() {
  console.log('🗑️  STEP 1: Deleting ALL dummy users...\n');
  
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  
  let deleteCount = 0;
  const deletePromises = [];
  
  snapshot.forEach((docSnap) => {
    const userId = docSnap.id;
    const data = docSnap.data();
    
    // Delete ANY dummy/test user
    if (
      userId.startsWith('ashkelon_user_') || 
      userId.startsWith('nearby_user_') ||
      userId.startsWith('test_user_') ||
      userId.startsWith('dummy_') ||
      data.isDummy === true ||
      data.isTestUser === true
    ) {
      deletePromises.push(deleteDoc(doc(db, 'users', userId)));
      deleteCount++;
      console.log(`   ❌ Deleting: ${userId}`);
    }
  });
  
  await Promise.all(deletePromises);
  console.log(`\n✅ Deleted ${deleteCount} dummy users!\n`);
}

async function createDummies() {
  console.log('👩 STEP 2: Creating 5 new female dummy users...\n');
  
  // YOUR LOCATION: 31.6964864, 34.5800704
  const baseLocation = {
    latitude: 31.6964864,
    longitude: 34.5800704
  };
  
  const dummyUsers = [
    {
      id: 'nearby_user_1',
      name: 'Sarah',
      age: 25,
      bio: 'Love coffee, books, and long walks on the beach ☕📚🌊',
      hobbies: ['Reading', 'Yoga', 'Photography'],
      photos: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
      ],
      distance: 120,
      height: '165cm',
      occupation: 'Teacher',
      drinking: 'social',
      smoking: 'no'
    },
    {
      id: 'nearby_user_2',
      name: 'Maya',
      age: 27,
      bio: 'Fitness enthusiast 💪 Dog lover 🐕 Adventure seeker 🏔️',
      hobbies: ['Gym', 'Hiking', 'Cooking'],
      photos: [
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
        'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400'
      ],
      distance: 230,
      height: '168cm',
      occupation: 'Personal Trainer',
      drinking: 'never',
      smoking: 'no'
    },
    {
      id: 'nearby_user_3',
      name: 'Noa',
      age: 24,
      bio: 'Artist 🎨 Music lover 🎵 Looking for someone genuine',
      hobbies: ['Painting', 'Guitar', 'Dancing'],
      photos: [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400'
      ],
      distance: 350,
      height: '163cm',
      occupation: 'Graphic Designer',
      drinking: 'social',
      smoking: 'no'
    },
    {
      id: 'nearby_user_4',
      name: 'Yael',
      age: 26,
      bio: 'Foodie 🍕 Traveler ✈️ Always up for new experiences',
      hobbies: ['Cooking', 'Travel', 'Wine Tasting'],
      photos: [
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400'
      ],
      distance: 180,
      height: '170cm',
      occupation: 'Chef',
      drinking: 'regular',
      smoking: 'no'
    },
    {
      id: 'nearby_user_5',
      name: 'Shira',
      age: 23,
      bio: 'Tech geek 💻 Cat mom 🐱 Looking for my player 2',
      hobbies: ['Gaming', 'Programming', 'Anime'],
      photos: [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400'
      ],
      distance: 290,
      height: '162cm',
      occupation: 'Software Developer',
      drinking: 'social',
      smoking: 'no'
    }
  ];
  
  const createPromises = dummyUsers.map(user => {
    const location = generateNearbyLocation(
      baseLocation.latitude,
      baseLocation.longitude,
      user.distance
    );
    const geohash = calculateGeohash(location.latitude, location.longitude);
    
    const userData = {
      uid: user.id,
      name: user.name,
      displayName: user.name,
      age: user.age,
      email: `${user.id}@dummy.com`,
      gender: 'female',
      photoURL: user.photos[0],
      photos: user.photos,
      hobbies: user.hobbies,
      bio: user.bio,
      height: user.height,
      occupation: user.occupation,
      drinking: user.drinking,
      smoking: user.smoking,
      onboardingComplete: true,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        geohash: geohash,
        lastUpdated: Timestamp.now()
      },
      preferences: {
        minDistance: 10,
        maxDistance: 500,
        ageRange: [20, 35],
        lookingFor: 'male'
      },
      swipedRight: [],
      swipedLeft: [],
      matches: [],
      lastActive: Timestamp.now(),
      createdAt: Timestamp.now(),
      isDummy: true,
      isTestUser: true,
      deleted: false
    };
    
    console.log(`   ✅ Creating: ${user.name} (${user.distance}m away)`);
    return setDoc(doc(db, 'users', user.id), userData);
  });
  
  await Promise.all(createPromises);
  console.log('\n🎉 All 5 female dummy users created!\n');
}

async function main() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  🦎 I4IGUANA - Cleanup & Setup     ║');
  console.log('╚══════════════════════════════════════╝\n');
  
  try {
    await cleanup();
    await createDummies();
    
    console.log('╔══════════════════════════════════════╗');
    console.log('║  ✅ SUCCESS! Everything is ready!   ║');
    console.log('╚══════════════════════════════════════╝\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
