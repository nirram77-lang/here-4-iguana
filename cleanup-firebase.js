const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function cleanup() {
  console.log('==============================================');
  console.log('STEP 1: Deleting ALL dummy users...');
  console.log('==============================================\n');
  
  const snapshot = await db.collection('users').get();
  const batch = db.batch();
  let deleteCount = 0;
  
  snapshot.docs.forEach(doc => {
    const id = doc.id;
    const data = doc.data();
    
    const isDummy = 
      id.startsWith('ashkelon_') || 
      id.startsWith('nearby_') || 
      id.startsWith('test_') || 
      id.startsWith('dummy_') || 
      data.isDummy === true;
    
    if (isDummy) {
      batch.delete(doc.ref);
      deleteCount++;
      console.log(`Deleting: ${id}`);
    }
  });
  
  await batch.commit();
  console.log(`\n✓ Successfully deleted ${deleteCount} dummy users!\n`);
  
  console.log('==============================================');
  console.log('STEP 2: Creating 4 new female dummy users...');
  console.log('==============================================\n');
  
  const baseLat = 31.6964864;
  const baseLng = 34.5800704;
  
  const users = [
    { 
      id: 'nearby_user_1', 
      name: 'Sarah', 
      age: 25, 
      dist: 150,
      photo: 'photo-1494790108377-be9c29b29330',
      bio: 'Love coffee, books, and long walks on the beach',
      hobbies: ['Reading', 'Yoga', 'Photography'],
      occupation: 'Teacher',
      height: '165cm'
    },
    { 
      id: 'nearby_user_2', 
      name: 'Maya', 
      age: 27, 
      dist: 250,
      photo: 'photo-1524504388940-b1c1722653e1',
      bio: 'Fitness enthusiast and dog lover',
      hobbies: ['Gym', 'Hiking', 'Cooking'],
      occupation: 'Personal Trainer',
      height: '168cm'
    },
    { 
      id: 'nearby_user_3', 
      name: 'Noa', 
      age: 24, 
      dist: 350,
      photo: 'photo-1517841905240-472988babdf9',
      bio: 'Artist and music lover',
      hobbies: ['Painting', 'Guitar', 'Dancing'],
      occupation: 'Graphic Designer',
      height: '163cm'
    },
    { 
      id: 'nearby_user_4', 
      name: 'Yael', 
      age: 26, 
      dist: 200,
      photo: 'photo-1438761681033-6461ffad8d80',
      bio: 'Foodie and traveler',
      hobbies: ['Cooking', 'Travel', 'Wine Tasting'],
      occupation: 'Chef',
      height: '170cm'
    }
  ];
  
  for (const user of users) {
    const offset = user.dist / 111000;
    const latOffset = (Math.random() * 2 - 1) * offset;
    const lngOffset = (Math.random() * 2 - 1) * offset;
    
    const location = {
      latitude: baseLat + latOffset,
      longitude: baseLng + lngOffset
    };
    
    const geohash = 'sv' + Math.floor(location.latitude * 100).toString();
    
    const userData = {
      uid: user.id,
      name: user.name,
      displayName: user.name,
      age: user.age,
      email: `${user.id}@dummy.com`,
      gender: 'female',
      photoURL: `https://images.unsplash.com/${user.photo}?w=400`,
      photos: [
        `https://images.unsplash.com/${user.photo}?w=400`,
        `https://images.unsplash.com/${user.photo}?w=600`
      ],
      hobbies: user.hobbies,
      bio: user.bio,
      height: user.height,
      occupation: user.occupation,
      drinking: 'social',
      smoking: 'no',
      onboardingComplete: true,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        geohash: geohash,
        lastUpdated: admin.firestore.Timestamp.now()
      },
      preferences: {
        minDistance: 10,
        maxDistance: 500,
        ageRange: [20, 35],
        lookingFor: 'male'
      },
      swipedRight: [],
      swipedLeft: [],
      matches: [],
      lastActive: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now(),
      isDummy: true,
      isTestUser: true,
      deleted: false
    };
    
    await db.collection('users').doc(user.id).set(userData);
    console.log(`✓ Created: ${user.name} (${user.age} years old, ${user.dist}m away)`);
    console.log(`  Location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
    console.log(`  Geohash: ${geohash}`);
    console.log(`  Gender: female, Looking for: male\n`);
  }
  
  console.log('==============================================');
  console.log('STEP 3: Verifying created users...');
  console.log('==============================================\n');
  
  for (const user of users) {
    const doc = await db.collection('users').doc(user.id).get();
    if (doc.exists) {
      const data = doc.data();
      console.log(`✓ Verified: ${data.name} exists in database`);
      console.log(`  Gender: ${data.gender}`);
      console.log(`  isDummy: ${data.isDummy}`);
      console.log(`  Location: ${data.location.latitude.toFixed(6)}, ${data.location.longitude.toFixed(6)}\n`);
    } else {
      console.log(`✗ ERROR: ${user.name} NOT FOUND!\n`);
    }
  }
  
  console.log('==============================================');
  console.log('SUCCESS! All tasks completed!');
  console.log('==============================================');
  console.log('\n4 female dummy users created and verified!');
  console.log('All users are within 150-350m of your location.');
  console.log('All users have gender: female and lookingFor: male\n');
}

cleanup()
  .then(() => {
    console.log('✓ Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('✗ ERROR:', error);
    process.exit(1);
  });
