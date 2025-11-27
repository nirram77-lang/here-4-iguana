// Run: node create-your-profile.js
// This creates YOUR profile in the database

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, Timestamp } = require('firebase/firestore');
const ngeohash = require('ngeohash');

const firebaseConfig = {
  apiKey: "AIzaSyA6laY3N84Pe_Fl1769bIoP4NbCxjmqP_o",
  authDomain: "i4iguana-89ed1.firebaseapp.com",
  projectId: "i4iguana-89ed1",
  storageBucket: "i4iguana-89ed1.firebasestorage.app",
  messagingSenderId: "143460198551",
  appId: "1:143460198551:web:5db80d325a549f3e4661d2",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Your location - Ashkelon Barnea
const YOUR_LAT = 31.6688;
const YOUR_LON = 34.5742;

async function createYourProfile() {
  console.log('🦎 Creating YOUR profile in the database...\n');
  
  try {
    // Sign in with your Google account (you need to provide credentials)
    // For now, we'll create the profile directly with your UID
    
    const yourUID = "uVe03sIfBseeD7V0M1UL8g1GnCp2"; // From the error message
    const geohash = ngeohash.encode(YOUR_LAT, YOUR_LON, 8);
    
    const yourProfile = {
      uid: yourUID,
      name: "You",
      age: 28,
      email: "your-email@gmail.com",
      photos: ["https://randomuser.me/api/portraits/men/32.jpg"],
      hobbies: ["Dancing", "Cocktails", "Live Music", "Beach Bars"],
      bio: "Love meeting new people at local spots! 🦎",
      location: {
        latitude: YOUR_LAT,
        longitude: YOUR_LON,
        geohash: geohash,
        lastUpdated: Timestamp.now()
      },
      preferences: {
        minDistance: 10,
        maxDistance: 500,
        ageRange: [20, 40]
      },
      swipedRight: [],
      swipedLeft: [],
      matches: [],
      lastActive: Timestamp.now(),
      createdAt: Timestamp.now()
    };
    
    // Save to Firestore
    await setDoc(doc(db, 'users', yourUID), yourProfile);
    
    console.log('✅ SUCCESS! Your profile has been created!');
    console.log('\n📊 Profile details:');
    console.log(`   👤 Name: ${yourProfile.name}`);
    console.log(`   🎂 Age: ${yourProfile.age}`);
    console.log(`   📍 Location: Ashkelon Barnea`);
    console.log(`   🎯 Search range: 10-500m`);
    console.log('\n🦎 Now refresh the app and try swiping again!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating profile:', error);
    process.exit(1);
  }
}

createYourProfile();