// scripts/update-demo-users.js
// Admin script to update demo users with photos

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Female demo photos
const femalePhotos = [
  'https://randomuser.me/api/portraits/women/1.jpg',
  'https://randomuser.me/api/portraits/women/2.jpg',
  'https://randomuser.me/api/portraits/women/3.jpg',
  'https://randomuser.me/api/portraits/women/4.jpg',
  'https://randomuser.me/api/portraits/women/5.jpg',
  'https://randomuser.me/api/portraits/women/6.jpg',
  'https://randomuser.me/api/portraits/women/7.jpg',
  'https://randomuser.me/api/portraits/women/8.jpg',
  'https://randomuser.me/api/portraits/women/9.jpg',
  'https://randomuser.me/api/portraits/women/10.jpg',
  'https://randomuser.me/api/portraits/women/11.jpg',
  'https://randomuser.me/api/portraits/women/12.jpg',
  'https://randomuser.me/api/portraits/women/13.jpg',
  'https://randomuser.me/api/portraits/women/14.jpg',
  'https://randomuser.me/api/portraits/women/15.jpg',
  'https://randomuser.me/api/portraits/women/16.jpg',
  'https://randomuser.me/api/portraits/women/17.jpg',
  'https://randomuser.me/api/portraits/women/18.jpg',
  'https://randomuser.me/api/portraits/women/19.jpg',
  'https://randomuser.me/api/portraits/women/20.jpg'
];

const bios = [
  'Love dancing and coffee ☕💃',
  'Adventure seeker 🏔️✨',
  'Foodie & bookworm 📚🍕',
  'Music lover & art enthusiast 🎨🎵',
  'Yoga & meditation 🧘‍♀️',
  'Travel addict ✈️🌍',
  'Beach & sunset lover 🌅',
  'Fitness & wellness 💪🥗',
  'Photography & nature 📸🌿',
  'Wine & good conversation 🍷'
];

async function updateDemoUsers() {
  try {
    console.log('🔥 Starting to update demo users with Admin SDK...\n');
    
    const usersSnapshot = await db.collection('users').get();
    
    let count = 0;
    const batch = db.batch();
    
    usersSnapshot.forEach((doc) => {
      const userId = doc.id;
      const userData = doc.data();
      
      // Check if it's a demo user (ashkelon_user or demo in email)
      if (userId.startsWith('ashkelon_user') || userData.email?.includes('ashkelon')) {
        const photoIndex = count % femalePhotos.length;
        const bioIndex = count % bios.length;
        
        const userRef = db.collection('users').doc(userId);
        
        batch.update(userRef, {
          photos: [femalePhotos[photoIndex]],
          isDemoUser: true,
          demoCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
          bio: userData.bio || bios[bioIndex]
        });
        
        console.log(`✅ Queued update for: ${userId}`);
        console.log(`   Photo: ${photoIndex + 1}`);
        console.log(`   Bio: ${bios[bioIndex]}\n`);
        
        count++;
      }
    });
    
    if (count > 0) {
      await batch.commit();
      console.log(`\n🎉 Successfully updated ${count} demo users!`);
      console.log('✨ All demo users now have:');
      console.log('   - Profile photos');
      console.log('   - isDemoUser: true flag');
      console.log('   - Updated bios');
    } else {
      console.log('⚠️ No demo users found to update.');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error updating users:', error);
    process.exit(1);
  }
}

updateDemoUsers();