// Run this script with: node seed-users.js
// This will add 50 realistic users to your database for testing

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, Timestamp } = require('firebase/firestore');
const ngeohash = require('ngeohash');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA6laY3N84Pe_Fl1769bIoP4NbCxjmqP_o",
  authDomain: "i4iguana-89ed1.firebaseapp.com",
  projectId: "i4iguana-89ed1",
  storageBucket: "i4iguana-89ed1.firebasestorage.app",
  messagingSenderId: "143460198551",
  appId: "1:143460198551:web:5db80d325a549f3e4661d2",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Base location (Tel Aviv center) - you can change this to your location
const BASE_LAT = 32.0853;
const BASE_LON = 34.7818;

// Random offset to create users within 10m-1km radius
function getRandomLocation(baseLat, baseLon, minMeters = 10, maxMeters = 1000) {
  const radiusInMeters = minMeters + Math.random() * (maxMeters - minMeters);
  const radiusInDegrees = radiusInMeters / 111320;
  
  const angle = Math.random() * 2 * Math.PI;
  const lat = baseLat + (radiusInDegrees * Math.cos(angle));
  const lon = baseLon + (radiusInDegrees * Math.sin(angle));
  
  return { latitude: lat, longitude: lon };
}

// Male names
const maleNames = [
  "Liam", "Noah", "Oliver", "Ethan", "Lucas", "Mason", "Logan", "Alexander",
  "Michael", "Daniel", "James", "Benjamin", "Jacob", "William", "Henry",
  "Sebastian", "Jack", "Owen", "Dylan", "Ryan", "Nathan", "Isaac", "Luke",
  "Gabriel", "Anthony", "Samuel"
];

// Female names
const femaleNames = [
  "Emma", "Olivia", "Ava", "Sophia", "Isabella", "Mia", "Charlotte", "Amelia",
  "Harper", "Evelyn", "Abigail", "Emily", "Elizabeth", "Sofia", "Avery",
  "Ella", "Scarlett", "Grace", "Chloe", "Victoria", "Riley", "Aria", "Lily",
  "Zoey", "Hannah"
];

// Hobbies pool
const hobbiesPool = [
  "Dancing", "DJ", "Cocktails", "House Music", "Techno", "EDM",
  "Live Music", "Karaoke", "Pool", "Darts", "Wine Tasting",
  "Craft Beer", "Rooftop Bars", "Late Nights", "Hip Hop",
  "Jazz", "Rock", "Salsa", "Bachata", "Festivals", "VIP Lounges",
  "Sports Bars", "Gaming", "Trivia Nights", "Stand-up Comedy"
];

// Get random hobbies
function getRandomHobbies() {
  const count = 3 + Math.floor(Math.random() * 2); // 3-4 hobbies
  const shuffled = [...hobbiesPool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Generate user data
function generateUser(index, isMale) {
  const name = isMale ? maleNames[index % maleNames.length] : femaleNames[index % femaleNames.length];
  const age = 20 + Math.floor(Math.random() * 31); // 20-50
  const location = getRandomLocation(BASE_LAT, BASE_LON);
  const geohash = ngeohash.encode(location.latitude, location.longitude, 8);
  
  return {
    uid: `pilot_user_${index + 1}`,
    name: name,
    age: age,
    email: `${name.toLowerCase()}${index}@pilot.test`,
    photos: [
      `/placeholder-${isMale ? 'male' : 'female'}-${(index % 5) + 1}.jpg`
    ],
    hobbies: getRandomHobbies(),
    bio: `Hey! I'm ${name}, ${age} years old. Love going out and meeting new people! 🎉`,
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
      geohash: geohash,
      lastUpdated: Timestamp.now()
    },
    preferences: {
      minDistance: 10,
      maxDistance: 1000,
      ageRange: [20, 50]
    },
    swipedRight: [],
    swipedLeft: [],
    matches: [],
    lastActive: Timestamp.now(),
    createdAt: Timestamp.now()
  };
}

// Main function to seed users
async function seedUsers() {
  console.log('🚀 Starting to seed 50 pilot users...\n');
  
  try {
    const users = [];
    
    // Generate 25 males and 25 females
    for (let i = 0; i < 25; i++) {
      users.push(generateUser(i, true)); // Male
      users.push(generateUser(i + 25, false)); // Female
    }
    
    // Add users to Firestore
    let count = 0;
    for (const user of users) {
      await setDoc(doc(db, 'users', user.uid), user);
      count++;
      console.log(`✅ Added ${user.name}, ${user.age} (${count}/50)`);
    }
    
    console.log('\n🎉 SUCCESS! All 50 users have been added to the database!');
    console.log('\n📍 Location details:');
    console.log(`   Base location: ${BASE_LAT}, ${BASE_LON}`);
    console.log(`   Radius: 10m - 1km`);
    console.log(`   Gender split: 25 males, 25 females`);
    console.log(`   Age range: 20-50 years`);
    console.log('\n🦎 Now open the app and start swiping!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

// Run the script
seedUsers();