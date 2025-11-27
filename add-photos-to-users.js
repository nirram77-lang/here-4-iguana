// Run this script with: node add-photos-to-users.js
// This will add real profile photos to all users

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

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

// Female names to match with female photos
const femaleNames = [
  "Noa", "Shira", "Tamar", "Maya", "Yael", "Lior", "Noga", "Dana",
  "Michal", "Sarah", "Hila", "Roni", "Keren", "Stav", "Inbar",
  "Shani", "Moran", "Amit", "Chen", "Gal", "Eden", "Neta", "Rotem",
  "Talia", "Danielle", "Sharon", "Ayelet", "Miri", "Adi", "Hadar",
  "Emma", "Olivia", "Ava", "Sophia", "Isabella", "Mia", "Charlotte", 
  "Amelia", "Harper", "Evelyn", "Abigail", "Emily", "Elizabeth", "Sofia", 
  "Avery", "Ella", "Scarlett", "Grace", "Chloe", "Victoria", "Riley", 
  "Aria", "Lily", "Zoey", "Hannah"
];

// Generate photo URL based on gender
function getPhotoUrl(name, index) {
  const isFemale = femaleNames.includes(name);
  
  if (isFemale) {
    // Female photos (1-70)
    const photoNum = (index % 70) + 1;
    return `https://randomuser.me/api/portraits/women/${photoNum}.jpg`;
  } else {
    // Male photos (1-99)
    const photoNum = (index % 99) + 1;
    return `https://randomuser.me/api/portraits/men/${photoNum}.jpg`;
  }
}

// Main function to add photos
async function addPhotosToUsers() {
  console.log('📸 Adding profile photos to all users...\n');
  
  try {
    // Get all users from Firestore
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    if (snapshot.empty) {
      console.log('❌ No users found in database!');
      process.exit(1);
    }

    console.log(`📊 Found ${snapshot.size} users. Adding photos...\n`);

    let count = 0;
    const updates = [];

    for (const userDoc of snapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const userName = userData.name || 'User';
      
      // Generate photo URL
      const photoUrl = getPhotoUrl(userName, count);
      
      // Update user with photo
      const userRef = doc(db, 'users', userId);
      updates.push(
        updateDoc(userRef, {
          photos: [photoUrl]
        })
      );

      count++;
      const gender = femaleNames.includes(userName) ? '👩' : '👨';
      console.log(`✅ ${count}. ${gender} ${userName} - ${photoUrl}`);
    }

    // Execute all updates
    await Promise.all(updates);
    
    console.log('\n🎉 SUCCESS! All users now have profile photos!');
    console.log('\n📊 Summary:');
    console.log(`   ✅ Updated ${count} users`);
    console.log(`   📸 Added real profile photos from randomuser.me`);
    console.log(`   👩 Female photos: women/1-70.jpg`);
    console.log(`   👨 Male photos: men/1-99.jpg`);
    console.log('\n🦎 Refresh the app to see the photos!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding photos:', error);
    process.exit(1);
  }
}

// Run the script
addPhotosToUsers();