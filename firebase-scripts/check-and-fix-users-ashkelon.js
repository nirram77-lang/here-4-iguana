// check-and-fix-users-ashkelon.js
// This script checks ALL dummy users and updates them to Ashkelon location
// Run: node check-and-fix-users-ashkelon.js

const admin = require('firebase-admin');
const geohash = require('ngeohash');

// ✅ YOUR EXACT LOCATION IN ASHKELON
const YOUR_LAT = 31.6964864;
const YOUR_LNG = 34.5800704;

console.log('🔍 CHECKING AND FIXING DUMMY USERS');
console.log('='.repeat(70));
console.log(`📍 Your exact location: ${YOUR_LAT}, ${YOUR_LNG} (Ashkelon)`);
console.log('='.repeat(70));
console.log('');

// Initialize Firebase Admin
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized\n');
} catch (error) {
  console.error('❌ Error loading serviceAccountKey.json');
  console.error('   Make sure the file exists in the same directory');
  process.exit(1);
}

const db = admin.firestore();

// Calculate distance between two points (in meters)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function checkAndFixUsers() {
  try {
    console.log('🔍 Step 1: Fetching ALL users from Firestore...\n');
    
    // Get ALL users
    const snapshot = await db.collection('users').get();
    
    if (snapshot.empty) {
      console.log('❌ No users found in database!\n');
      return;
    }
    
    console.log(`📊 Found ${snapshot.size} total users\n`);
    console.log('='.repeat(70));
    
    let dummyCount = 0;
    let updatedCount = 0;
    let inRangeCount = 0;
    let outOfRangeCount = 0;
    
    const batch = db.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500;
    
    console.log('🔍 Analyzing users...\n');
    
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;
      
      // Check if this is a dummy user (various patterns)
      const isDummy = 
        userId.includes('dummy') || 
        userId.includes('nearby_user_') ||
        userData.isDummy === true ||
        (userData.email && userData.email.includes('@dummy.com'));
      
      if (isDummy) {
        dummyCount++;
        
        const userLat = userData.location?.latitude;
        const userLng = userData.location?.longitude;
        
        if (userLat && userLng) {
          const distance = calculateDistance(YOUR_LAT, YOUR_LNG, userLat, userLng);
          const distanceKm = (distance / 1000).toFixed(2);
          
          // Check if user is in range (within 500m)
          if (distance <= 500) {
            inRangeCount++;
            console.log(`✅ ${userData.name || userId}: ${Math.round(distance)}m - IN RANGE`);
          } else {
            outOfRangeCount++;
            console.log(`❌ ${userData.name || userId}: ${distanceKm}km - OUT OF RANGE (will update)`);
            
            // Generate new location near Ashkelon (50-400 meters)
            const randomDistance = 50 + Math.random() * 350; // 50-400m
            const randomAngle = Math.random() * 2 * Math.PI;
            
            // Convert to lat/lng offset
            const latOffset = (randomDistance * Math.cos(randomAngle)) / 111000;
            const lngOffset = (randomDistance * Math.sin(randomAngle)) / (111000 * Math.cos(YOUR_LAT * Math.PI / 180));
            
            const newLat = YOUR_LAT + latOffset;
            const newLng = YOUR_LNG + lngOffset;
            const newGeohash = geohash.encode(newLat, newLng, 8);
            
            // Update user location
            const userRef = db.collection('users').doc(userId);
            batch.update(userRef, {
              'location.latitude': newLat,
              'location.longitude': newLng,
              'location.geohash': newGeohash,
              'location.lastUpdated': admin.firestore.FieldValue.serverTimestamp()
            });
            
            batchCount++;
            updatedCount++;
            
            // Commit batch if it reaches BATCH_SIZE
            if (batchCount >= BATCH_SIZE) {
              await batch.commit();
              console.log(`\n💾 Committed ${batchCount} updates\n`);
              batchCount = 0;
            }
          }
        } else {
          console.log(`⚠️  ${userData.name || userId}: No location data`);
        }
      }
    }
    
    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
      console.log(`\n💾 Committed final ${batchCount} updates\n`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(70));
    console.log(`Total users in DB:        ${snapshot.size}`);
    console.log(`Dummy users found:        ${dummyCount}`);
    console.log(`Already in range (≤500m): ${inRangeCount}`);
    console.log(`Out of range:             ${outOfRangeCount}`);
    console.log(`Updated to Ashkelon:      ${updatedCount}`);
    console.log('='.repeat(70));
    
    if (updatedCount > 0) {
      console.log('\n✅ SUCCESS! Updated dummy users to your location in Ashkelon!');
      console.log('📱 Refresh your app (F5) to see the nearby users!');
    } else if (inRangeCount > 0) {
      console.log('\n✅ All dummy users are already in range!');
      console.log('📱 Refresh your app (F5) if you don\'t see them');
    } else {
      console.log('\n⚠️  No dummy users found or no location data');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

// Run the script
checkAndFixUsers();
