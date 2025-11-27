// update-demo-users.js
// Script to add photos to demo users in Firestore

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyA6laY3N84Pe_Fl1769bIoP4NbCxjmqP_o",
  authDomain: "i4iguana-89ed1.firebaseapp.com",
  projectId: "i4iguana-89ed1",
  storageBucket: "i4iguana-89ed1.firebasestorage.app",
  messagingSenderId: "143460198551",
  appId: "1:143460198551:web:5db80d325a549f3e4661d2",
  measurementId: "G-CC0HZW3H0K"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Array of placeholder images from various sources
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

async function updateDemoUsers() {
  try {
    console.log('🔥 Starting to update demo users...');
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    let count = 0;
    
    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      
      // Check if user is a demo user (ashkelon_user)
      if (userDoc.id.startsWith('ashkelon_user') || userData.email?.includes('ashkelon')) {
        const photoIndex = count % femalePhotos.length;
        
        await updateDoc(doc(db, 'users', userDoc.id), {
          photos: [femalePhotos[photoIndex]],
          isDemoUser: true, // Mark as demo user
          demoCreatedAt: new Date().toISOString(),
          // Add some variety to bios if missing
          bio: userData.bio || `Love ${['dancing', 'coffee', 'hiking', 'music', 'art', 'travel'][count % 6]} ❤️`
        });
        
        console.log(`✅ Updated ${userDoc.id} with photo ${photoIndex + 1}`);
        count++;
      }
    }
    
    console.log(`\n🎉 Successfully updated ${count} demo users!`);
    console.log('✨ All demo users now have photos and are marked with isDemoUser: true');
    
  } catch (error) {
    console.error('❌ Error updating users:', error);
  }
}

updateDemoUsers();