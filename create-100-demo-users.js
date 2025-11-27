const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const ngeohash = require('ngeohash');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Petah Tikva center coordinates
const CENTER_LAT = 32.0853;
const CENTER_LNG = 34.7818;

// Random names in Hebrew
const maleNames = [
  'דניאל', 'יוסף', 'דוד', 'משה', 'אבי', 'רון', 'עומר', 'נועם', 'אור', 'תום',
  'אלון', 'גיא', 'יונתן', 'עידו', 'שי', 'ליאור', 'עמית', 'אלעד', 'רועי', 'איתי',
  'אריאל', 'נתנאל', 'עדי', 'בן', 'מתן', 'אדם', 'איל', 'טל', 'ניר', 'שחר',
  'לירון', 'יובל', 'אסף', 'נדב', 'אלכס', 'מיכאל', 'רפאל', 'גל', 'זיו', 'ערן',
  'שלום', 'חיים', 'יעקב', 'אברהם', 'יצחק', 'שמואל', 'אהרון', 'לוי', 'כהן', 'ישראל'
];

const femaleNames = [
  'שרה', 'רחל', 'לאה', 'מיכל', 'דנה', 'נועה', 'מיה', 'עדן', 'תמר', 'רוני',
  'יעל', 'שירה', 'אורית', 'ענת', 'הילה', 'מור', 'ליאת', 'רותם', 'מאיה', 'קרן',
  'נטע', 'שני', 'גל', 'בר', 'עינב', 'אביגיל', 'דקלה', 'ליה', 'אלה', 'שירן',
  'ניצן', 'אפרת', 'תהילה', 'אורי', 'זהר', 'סיגל', 'מירב', 'אסתר', 'דבורה', 'נעמי',
  'ברכה', 'חנה', 'רבקה', 'דינה', 'שושנה', 'שלומית', 'יפה', 'חוה', 'מלכה', 'רות'
];

const hobbies = [
  'ריצה', 'כדורגל', 'כושר', 'יוגה', 'קריאה', 'מוזיקה', 'קולנוע', 'בישול',
  'טיולים', 'צילום', 'ציור', 'טניס', 'שחייה', 'ריקוד', 'גיטרה', 'פיאנו',
  'סרטים', 'נטפליקס', 'משחקי וידאו', 'כתיבה', 'פאזלים', 'שחמט', 'קפה',
  'יין', 'אופניים', 'קמפינג', 'גלישה', 'סנובורד', 'סקי', 'טיפוס'
];

const photos = {
  male: [
    'https://randomuser.me/api/portraits/men/1.jpg',
    'https://randomuser.me/api/portraits/men/2.jpg',
    'https://randomuser.me/api/portraits/men/3.jpg',
    'https://randomuser.me/api/portraits/men/4.jpg',
    'https://randomuser.me/api/portraits/men/5.jpg',
    'https://randomuser.me/api/portraits/men/6.jpg',
    'https://randomuser.me/api/portraits/men/7.jpg',
    'https://randomuser.me/api/portraits/men/8.jpg',
    'https://randomuser.me/api/portraits/men/9.jpg',
    'https://randomuser.me/api/portraits/men/10.jpg'
  ],
  female: [
    'https://randomuser.me/api/portraits/women/1.jpg',
    'https://randomuser.me/api/portraits/women/2.jpg',
    'https://randomuser.me/api/portraits/women/3.jpg',
    'https://randomuser.me/api/portraits/women/4.jpg',
    'https://randomuser.me/api/portraits/women/5.jpg',
    'https://randomuser.me/api/portraits/women/6.jpg',
    'https://randomuser.me/api/portraits/women/7.jpg',
    'https://randomuser.me/api/portraits/women/8.jpg',
    'https://randomuser.me/api/portraits/women/9.jpg',
    'https://randomuser.me/api/portraits/women/10.jpg'
  ]
};

// Generate random location within radius
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

async function createDemoUsers() {
  console.log('🚀 Creating 100 demo users in Petah Tikva area...\n');
  
  const batch = db.batch();
  let count = 0;

  for (let i = 0; i < 100; i++) {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const name = gender === 'male' 
      ? randomChoice(maleNames) 
      : randomChoice(femaleNames);
    
    const age = Math.floor(Math.random() * (55 - 18 + 1)) + 18; // 18-55
    const location = randomLocation(CENTER_LAT, CENTER_LNG, 800); // Within 800m
    const geohash = ngeohash.encode(location.latitude, location.longitude, 8);
    
    const lookingFor = Math.random() > 0.5 ? 'male' : 'female';
    const userHobbies = randomChoices(hobbies, Math.floor(Math.random() * 3) + 3); // 3-5 hobbies
    
    // Random photos (1-3 photos)
    const photoCount = Math.floor(Math.random() * 3) + 1;
    const userPhotos = [];
    for (let j = 0; j < photoCount; j++) {
      const photoIndex = Math.floor(Math.random() * 10);
      userPhotos.push(photos[gender][photoIndex]);
    }

    const userId = `demo_user_${i + 1}_${Date.now()}`;
    const userRef = db.collection('users').doc(userId);

    const userData = {
      uid: userId,
      email: `demo${i + 1}@i4iguana.com`,
      name: name,
      age: age,
      gender: gender,
      photos: userPhotos,
      hobbies: userHobbies,
      bio: `היי, אני ${name}, בן/בת ${age}. אוהב/ת ${userHobbies[0]} ו${userHobbies[1]}! 🦎`,
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
        ageRange: [age - 5, age + 5]
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

    if (count % 10 === 0) {
      console.log(`✅ Created ${count}/100 users...`);
    }
  }

  await batch.commit();
  console.log(`\n🎉 Successfully created ${count} demo users in Petah Tikva!`);
  console.log(`📍 Location: ${CENTER_LAT}, ${CENTER_LNG}`);
  console.log(`📏 Radius: 800m`);
}

createDemoUsers()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });