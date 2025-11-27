const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const ngeohash = require('ngeohash');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// YOUR EXACT LOCATION (from console)
const CENTER_LAT = 32.1028696;
const CENTER_LNG = 34.7897856;

const maleNames = [
  'דניאל', 'יוסף', 'דוד', 'משה', 'אבי', 'רון', 'עומר', 'נועם', 'אור', 'תום',
  'אלון', 'גיא', 'יונתן', 'עידו', 'שי', 'ליאור', 'עמית', 'אלעד', 'רועי', 'איתי',
  'אריאל', 'נתנאל', 'עדי', 'בן', 'מתן', 'אדם', 'איל', 'טל', 'ניר', 'שחר'
];

const femaleNames = [
  'שרה', 'רחל', 'לאה', 'מיכל', 'דנה', 'נועה', 'מיה', 'עדן', 'תמר', 'רוני',
  'יעל', 'שירה', 'אורית', 'ענת', 'הילה', 'מור', 'ליאת', 'רותם', 'מאיה', 'קרן',
  'נטע', 'שני', 'גל', 'בר', 'עינב', 'אביגיל', 'דקלה', 'ליה', 'אלה', 'שירן'
];

const hobbies = [
  'ריצה', 'כדורגל', 'כושר', 'יוגה', 'קריאה', 'מוזיקה', 'קולנוע', 'בישול',
  'טיולים', 'צילום', 'ציור', 'טניס', 'שחייה', 'ריקוד', 'גיטרה', 'נטפליקס'
];

const photos = {
  male: [
    'https://randomuser.me/api/portraits/men/1.jpg',
    'https://randomuser.me/api/portraits/men/2.jpg',
    'https://randomuser.me/api/portraits/men/3.jpg',
    'https://randomuser.me/api/portraits/men/4.jpg',
    'https://randomuser.me/api/portraits/men/5.jpg',
    'https://randomuser.me/api/portraits/men/10.jpg',
    'https://randomuser.me/api/portraits/men/11.jpg',
    'https://randomuser.me/api/portraits/men/12.jpg',
    'https://randomuser.me/api/portraits/men/13.jpg',
    'https://randomuser.me/api/portraits/men/14.jpg'
  ],
  female: [
    'https://randomuser.me/api/portraits/women/1.jpg',
    'https://randomuser.me/api/portraits/women/2.jpg',
    'https://randomuser.me/api/portraits/women/3.jpg',
    'https://randomuser.me/api/portraits/women/4.jpg',
    'https://randomuser.me/api/portraits/women/5.jpg',
    'https://randomuser.me/api/portraits/women/10.jpg',
    'https://randomuser.me/api/portraits/women/11.jpg',
    'https://randomuser.me/api/portraits/women/12.jpg',
    'https://randomuser.me/api/portraits/women/13.jpg',
    'https://randomuser.me/api/portraits/women/14.jpg'
  ]
};

function randomLocation(centerLat, centerLng, radiusInMeters) {
  const radiusInDegrees = radiusInMeters / 111320;
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  
  return {
    latitude: centerLat + y,
    longitude: centerLng + x
  };
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomChoices(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function createNearbyUsers() {
  console.log('🚀 Creating 100 users near YOUR location...\n');
  console.log(`📍 Your location: ${CENTER_LAT}, ${CENTER_LNG}\n`);
  
  const batch = db.batch();
  let count = 0;

  for (let i = 0; i < 100; i++) {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const name = gender === 'male' ? randomChoice(maleNames) : randomChoice(femaleNames);
    const age = Math.floor(Math.random() * (55 - 18 + 1)) + 18;
    
    // Create users within 500m radius (well within 1000m search radius)
    const location = randomLocation(CENTER_LAT, CENTER_LNG, 500);
    const geohash = ngeohash.encode(location.latitude, location.longitude, 8);
    
    const lookingFor = Math.random() > 0.5 ? 'male' : 'female';
    const userHobbies = randomChoices(hobbies, Math.floor(Math.random() * 3) + 3);
    
    const photoCount = Math.floor(Math.random() * 2) + 2; // 2-3 photos
    const userPhotos = [];
    for (let j = 0; j < photoCount; j++) {
      const photoIndex = Math.floor(Math.random() * 10);
      userPhotos.push(photos[gender][photoIndex]);
    }

    const userId = `nearby_user_${i + 1}_${Date.now()}`;
    const userRef = db.collection('users').doc(userId);

    const userData = {
      uid: userId,
      email: `nearby${i + 1}@i4iguana.com`,
      name: name,
      age: age,
      gender: gender,
      photos: userPhotos,
      hobbies: userHobbies,
      bio: `היי! אני ${name}, ${age}. אוהב/ת ${userHobbies[0]}, ${userHobbies[1]} וקפה טוב ☕🦎`,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        geohash: geohash,
        lastUpdated: admin.firestore.Timestamp.now()
      },
      preferences: {
        lookingFor: lookingFor,
        minDistance: 10,
        maxDistance: 1000,
        ageRange: [Math.max(18, age - 7), Math.min(55, age + 7)]
      },
      swipedRight: [],
      swipedLeft: [],
      matches: [],
      passesLeft: 1,
      isPremium: false,
      lastResetDate: new Date().toDateString(),
      createdAt: admin.firestore.Timestamp.now(),
      lastActive: admin.firestore.Timestamp.now()
    };

    batch.set(userRef, userData);
    count++;

    if (count % 20 === 0) {
      console.log(`✅ Created ${count}/100 users...`);
    }
  }

  await batch.commit();
  console.log(`\n🎉 Created ${count} users within 500m of your location!`);
}

createNearbyUsers()
  .then(() => {
    console.log('✅ Done! Refresh the app now!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });