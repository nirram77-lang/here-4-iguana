// Run this script with: node update-users-close.js
// This will move all 50 existing users to be 10-500m from you

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, Timestamp } = require('firebase/firestore');
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

// Ashkelon Barnea - Your location
const YOUR_LAT = 31.6688;
const YOUR_LON = 34.5742;

// Random offset to create users within 10-500m radius (same building/street)
function getRandomLocationNearby(baseLat, baseLon, minMeters = 10, maxMeters = 500) {
  const radiusInMeters = minMeters + Math.random() * (maxMeters - minMeters);
  const radiusInDegrees = radiusInMeters / 111320;
  
  const angle = Math.random() * 2 * Math.PI;
  const lat = baseLat + (radiusInDegrees * Math.cos(angle));
  const lon = baseLon + (radiusInDegrees * Math.sin(angle));
  
  return { 
    latitude: lat, 
    longitude: lon,
    distance: Math.round(radiusInMeters)
  };
}

// Main function to update users
async function updateUsersToBeNearby() {
  console.log('🚀 Moving all users to be 10-500m from your location...\n');
  console.log(`📍 Your location: ${YOUR_LAT}, ${YOUR_LON} (Ashkelon Barnea)\n`);
  
  try {
    // Get all users from Firestore
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    if (snapshot.empty) {
      console.log('❌ No users found in database!');
      console.log('💡 Run seed-ashkelon-users.js first to create users.\n');
      process.exit(1);
    }

    console.log(`📊 Found ${snapshot.size} users. Moving them closer to you...\n`);

    let count = 0;
    const updates = [];

    for (const userDoc of snapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Get new close location (10-500m)
      const newLocation = getRandomLocationNearby(YOUR_LAT, YOUR_LON, 10, 500);
      const newGeohash = ngeohash.encode(newLocation.latitude, newLocation.longitude, 8);
      
      // Update user location
      const userRef = doc(db, 'users', userId);
      updates.push(
        updateDoc(userRef, {
          'location.latitude': newLocation.latitude,
          'location.longitude': newLocation.longitude,
          'location.geohash': newGeohash,
          'location.lastUpdated': Timestamp.now(),
          'preferences.maxDistance': 500, // Set max distance to 500m
        })
      );

      count++;
      const gender = userData.age < 30 ? '👤' : '👤';
      console.log(`✅ ${count}. ${userData.name || 'User'} - moved to ${newLocation.distance}m away`);
    }

    // Execute all updates
    await Promise.all(updates);
    
    console.log('\n🎉 SUCCESS! All users have been moved closer!');
    console.log('\n📊 Summary:');
    console.log(`   ✅ Updated ${count} users`);
    console.log(`   📍 New range: 10-500 meters from you`);
    console.log(`   🎯 Perfect for "Here & Now" matching!`);
    console.log('\n🦎 Open the app and search with 500m radius!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating users:', error);
    process.exit(1);
  }
}

// Run the script
updateUsersToBeNearby();