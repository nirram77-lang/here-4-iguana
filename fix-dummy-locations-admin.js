// fix-dummy-locations-admin.js
// Firebase Admin SDK - עוקף את כל Security Rules!
// 
// HOW TO USE:
// ===========
// Option 1: Run with your current location as parameters:
//   node fix-dummy-locations-admin.js 31.686656 34.583347
//
// Option 2: Edit YOUR_LAT and YOUR_LNG below and run:
//   node fix-dummy-locations-admin.js
//
// Get your current location from browser console (F12):
//   navigator.geolocation.getCurrentPosition(pos => {
//     console.log(pos.coords.latitude, pos.coords.longitude);
//   });
//
// DISTANCE RANGE: 10-300 meters (perfect for 10-500m search range)

const admin = require('firebase-admin');

// Your location - UPDATE THIS BEFORE RUNNING!
// Get your location from browser console:
// navigator.geolocation.getCurrentPosition(pos => console.log(pos.coords.latitude, pos.coords.longitude))
const YOUR_LAT = process.argv[2] ? parseFloat(process.argv[2]) : 31.686656;
const YOUR_LNG = process.argv[3] ? parseFloat(process.argv[3]) : 34.583347;

// Initialize Firebase Admin
// Option 1: Using Application Default Credentials (if running on Google Cloud)
// Option 2: Using Service Account (המומלץ - נשתמש בזה)

try {
  // Check if service account file exists
  const serviceAccount = require('./serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('✅ Firebase Admin initialized successfully!\n');
} catch (error) {
  console.error('❌ Error: Could not find serviceAccountKey.json');
  console.error('📋 Follow the instructions to download it first!\n');
  process.exit(1);
}

const db = admin.firestore();

async function fixDummyUsers() {
  console.log('🔧 Starting to fix dummy users locations...\n');
  console.log(`📍 Your location: ${YOUR_LAT}, ${YOUR_LNG}\n`);
  
  try {
    // Get all dummy users
    const snapshot = await db.collection('users')
      .where('uid', '>=', 'nearby_user_')
      .where('uid', '<=', 'nearby_user_\uf8ff')
      .get();
    
    console.log(`📊 Found ${snapshot.size} dummy users\n`);
    
    if (snapshot.empty) {
      console.log('❌ No dummy users found!');
      console.log('💡 Make sure you have users with uid starting with "nearby_user_"');
      return;
    }
    
    let fixed = 0;
    const batch = db.batch(); // Use batch for efficiency
    
    snapshot.forEach((doc) => {
      const user = doc.data();
      
      // Generate random location within 10-300m (closer range!)
      const distance = 10 + Math.random() * 290; // 10-300m
      const angle = Math.random() * 2 * Math.PI;
      
      // Calculate offset
      const latOffset = (distance / 111000) * Math.cos(angle);
      const lngOffset = (distance / (111000 * Math.cos(YOUR_LAT * Math.PI / 180))) * Math.sin(angle);
      
      const newLat = YOUR_LAT + latOffset;
      const newLng = YOUR_LNG + lngOffset;
      
      console.log(`🔧 ${user.name || user.displayName || doc.id}`);
      console.log(`   Before: ${user.location?.latitude?.toFixed(6)}, ${user.location?.longitude?.toFixed(6)}`);
      console.log(`   After:  ${newLat.toFixed(6)}, ${newLng.toFixed(6)} (~${Math.round(distance)}m)`);
      
      // Add to batch
      batch.update(doc.ref, {
        'location.latitude': newLat,
        'location.longitude': newLng,
        'location.lastUpdated': admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`   ✅ Queued for update\n`);
      fixed++;
    });
    
    // Commit all updates at once
    console.log('💾 Committing all updates to Firestore...\n');
    await batch.commit();
    
    console.log('='.repeat(60));
    console.log(`🎉 SUCCESS! Updated ${fixed} users`);
    console.log('🔄 Refresh your app (F5) to see the changes!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
  
  process.exit(0);
}

// Run it!
fixDummyUsers();