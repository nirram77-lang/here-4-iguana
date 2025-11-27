const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const geohash = require('ngeohash');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

// Your location (Modiâin)
const YOUR_LOCATION = {
  latitude: 31.8967,
  longitude: 34.9896
};

// Your user ID - WILL BE PROTECTED
const YOUR_USER_ID = 'UVe03sIfBseeD7V0M1WL8g1GhCp2';

function getRandomLocationNearby(centerLat, centerLng, minRadius = 50, maxRadius = 400) {
  const radiusInDegrees = (Math.random() * (maxRadius - minRadius) + minRadius) / 111320;
  const angle = Math.random() * Math.PI * 2;
  const newLat = centerLat + (radiusInDegrees * Math.sin(angle));
  const newLng = centerLng + (radiusInDegrees * Math.cos(angle) / Math.cos(centerLat * Math.PI / 180));
  
  return {
    latitude: parseFloat(newLat.toFixed(6)),
    longitude: parseFloat(newLng.toFixed(6))
  };
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function updateAllUsers() {
  try {
    console.log('🚀 Starting location update...');
    console.log(`📍 Your location: ${YOUR_LOCATION.latitude}, ${YOUR_LOCATION.longitude}`);
    console.log(`🛡️  Your ID (will be protected): ${YOUR_USER_ID}`);
    console.log('');

    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found!');
      return;
    }

    console.log(`📊 Found ${usersSnapshot.size} total users`);
    console.log('');

    let updated = 0;
    let skipped = 0;

    for (const doc of usersSnapshot.docs) {
      const userId = doc.id;
      
      // Skip your account
      if (userId === YOUR_USER_ID) {
        console.log(`🛡️  Skipped: Your account (${userId.substring(0, 8)}...)`);
        skipped++;
        continue;
      }

      try {
        const userData = doc.data();
        const newLocation = getRandomLocationNearby(
          YOUR_LOCATION.latitude,
          YOUR_LOCATION.longitude,
          50,
          400
        );
        
        const newGeohash = geohash.encode(newLocation.latitude, newLocation.longitude, 9);
        const distance = calculateDistance(
          YOUR_LOCATION.latitude,
          YOUR_LOCATION.longitude,
          newLocation.latitude,
          newLocation.longitude
        );
        
        await db.collection('users').doc(userId).update({
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          geohash: newGeohash,
          lastLocationUpdate: admin.firestore.FieldValue.serverTimestamp()
        });
        
        updated++;
        const name = userData.name || userData.displayName || 'Unknown';
        console.log(`✅ ${updated}. ${name} - ${Math.round(distance)}m away`);
        
      } catch (error) {
        console.error(`❌ Failed: ${userId.substring(0, 8)}...`);
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Updated: ${updated} users`);
    console.log(`🛡️  Protected: ${skipped} users (you)`);
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('🎉 Done! Refresh your app now!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit();
  }
}

updateAllUsers();