// Run this script with: node seed-ashkelon-users.js
// This will add 30 users around Ashkelon, Barnea neighborhood

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

// Ashkelon Barnea neighborhood coordinates
const BASE_LAT = 31.6688;
const BASE_LON = 34.5742;

// Random offset to create users within 100m-3km radius
function getRandomLocation(baseLat, baseLon, minMeters = 100, maxMeters = 3000) {
  const radiusInMeters = minMeters + Math.random() * (maxMeters - minMeters);
  const radiusInDegrees = radiusInMeters / 111320;
  
  const angle = Math.random() * 2 * Math.PI;
  const lat = baseLat + (radiusInDegrees * Math.cos(angle));
  const lon = baseLon + (radiusInDegrees * Math.sin(angle));
  
  return { latitude: lat, longitude: lon };
}

// Female names (Israeli style)
const femaleNames = [
  "Noa", "Shira", "Tamar", "Maya", "Yael", "Lior", "Noga", "Dana",
  "Michal", "Sarah", "Hila", "Roni", "Keren", "Stav", "Inbar",
  "Shani", "Moran", "Amit", "Chen", "Gal", "Eden", "Neta", "Rotem",
  "Talia", "Danielle", "Sharon", "Ayelet", "Miri", "Adi", "Hadar"
];

// Male names (Israeli style)
const maleNames = [
  "Yoni", "Amit", "Eitan", "Idan", "Noam", "Guy", "Omri", "Tal",
  "Itai", "Bar", "Alon", "Erez", "Nadav", "Lior", "Ofir"
];

// Hobbies pool (nightlife focused)
const hobbiesPool = [
  "Dancing", "DJ", "Cocktails", "House Music", "Techno", "EDM",
  "Live Music", "Beach Bars", "Karaoke", "Wine Tasting",
  "Craft Beer", "Rooftop Bars", "Late Nights", "Hip Hop",
  "Reggae", "Salsa", "Rock", "Pool", "Darts",
  "Beach Parties", "Festivals", "Sports Bars", "Indie Music"
];

// Get random hobbies
function getRandomHobbies() {
  const count = 3 + Math.floor(Math.random() * 2); // 3-4 hobbies
  const shuffled = [...hobbiesPool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Bios
const bios = [
  "Love the Ashkelon beach scene! Always down for a night out 🌊",
  "Local to Barnea. Let's grab drinks! 🍹",
  "Beach lover, music enthusiast, night owl 🎵",
  "Here for good vibes and great company! ✨",
  "Ashkelon born and raised. Love our local spots! 🦎",
  "Always exploring new bars and meeting new people 🎉",
  "Work hard, party harder. Let's meet up! 💃",
  "Local DJ, catch me at the clubs! 🎧",
  "Beach by day, bars by night 🌅",
  "Love live music and spontaneous adventures! 🎸"
];

// Generate user data
function generateUser(index, isFemale) {
  const namePool = isFemale ? femaleNames : maleNames;
  const name = namePool[index % namePool.length];
  const age = 22 + Math.floor(Math.random() * 16); // 22-37
  const location = getRandomLocation(BASE_LAT, BASE_LON);
  const geohash = ngeohash.encode(location.latitude, location.longitude, 8);
  
  return {
    uid: `ashkelon_user_${index + 1}`,
    name: name,
    age: age,
    email: `${name.toLowerCase()}${index}@ashkelon.local`,
    photos: [
      `https://i.pravatar.cc/400?img=${isFemale ? index + 1 : index + 50}`
    ],
    hobbies: getRandomHobbies(),
    bio: bios[Math.floor(Math.random() * bios.length)],
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
      geohash: geohash,
      lastUpdated: Timestamp.now()
    },
    preferences: {
      minDistance: 10,
      maxDistance: 3000,
      ageRange: [20, 40]
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
  console.log('🚀 Starting to seed 30 users in Ashkelon, Barnea area...\n');
  
  try {
    const users = [];
    
    // Generate 20 females and 10 males
    for (let i = 0; i < 20; i++) {
      users.push(generateUser(i, true)); // Female
    }
    for (let i = 20; i < 30; i++) {
      users.push(generateUser(i, false)); // Male
    }
    
    // Add users to Firestore
    let count = 0;
    for (const user of users) {
      await setDoc(doc(db, 'users', user.uid), user);
      count++;
      const gender = count <= 20 ? '♀️' : '♂️';
      console.log(`✅ ${gender} Added ${user.name}, ${user.age} (${count}/30)`);
    }
    
    console.log('\n🎉 SUCCESS! All 30 users have been added to the database!');
    console.log('\n📍 Location details:');
    console.log(`   Area: Ashkelon, Barnea neighborhood`);
    console.log(`   Base location: ${BASE_LAT}, ${BASE_LON}`);
    console.log(`   Radius: 100m - 3km`);
    console.log(`   Gender split: 20 females, 10 males`);
    console.log(`   Age range: 22-37 years`);
    console.log('\n🦎 Now open the app in Ashkelon and start swiping!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

// Run the script
seedUsers();