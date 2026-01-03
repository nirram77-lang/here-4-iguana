/**
 * 🦎 I4IGUANA - Seed Entertainment Zones & Events
 * 
 * Run this script to create sample data for testing:
 * node seed-zones-events.js
 * 
 * Creates:
 * - Entertainment zones in Ashkelon & Tel Aviv
 * - Special events at Archie Bar
 * - "Planned" counts to create FOMO!
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://iguana-dating.firebaseio.com"
});

const db = admin.firestore();

// ═══════════════════════════════════════════════════════════════════════════
// Entertainment Zones Data
// ═══════════════════════════════════════════════════════════════════════════

const entertainmentZones = [
  // ASHKELON
  {
    id: 'ashkelon-marina',
    name: 'מרינה אשקלון',
    nameEn: 'Ashkelon Marina',
    city: 'אשקלון',
    location: { lat: 31.6696, lng: 34.5566 },
    radius: 500,
    venues: [
      { id: 'marina-cafe', name: 'Marina Café', type: 'cafe' },
      { id: 'yacht-bar', name: 'Yacht Bar', type: 'bar' },
      { id: 'delmare', name: 'Delmare', type: 'bar' },
    ],
    plannedCount: 23,  // FOMO!
    activeCount: 12,
    historicalAvg: 35,  // "בשישי האחרון היו כאן 35 רווקים"
    image: '/marina-ashkelon.jpg'
  },
  {
    id: 'ashkelon-delila',
    name: 'חוף דלילה',
    nameEn: 'Delila Beach',
    city: 'אשקלון',
    location: { lat: 31.6650, lng: 34.5450 },
    radius: 400,
    venues: [
      { id: 'archie-bar', name: 'Archie Bar', type: 'bar' },
      { id: 'the-jack', name: 'The Jack', type: 'bar' },
    ],
    plannedCount: 34,  // FOMO! Higher because of event
    activeCount: 8,
    historicalAvg: 42,
    image: '/delila-beach.jpg'
  },
  {
    id: 'ashkelon-barnea',
    name: 'ברנע סנטר',
    nameEn: 'Barnea Center',
    city: 'אשקלון',
    location: { lat: 31.6700, lng: 34.5700 },
    radius: 300,
    venues: [
      { id: 'coffee-bar', name: 'Coffee Bar', type: 'cafe' },
      { id: 'resto-lounge', name: 'Resto Lounge', type: 'restaurant' },
    ],
    plannedCount: 8,
    activeCount: 3,
    historicalAvg: 15,
    image: '/barnea-center.jpg'
  },
  
  // TEL AVIV
  {
    id: 'tlv-rothschild',
    name: 'רוטשילד',
    nameEn: 'Rothschild Boulevard',
    city: 'תל אביב',
    location: { lat: 32.0636, lng: 34.7745 },
    radius: 600,
    venues: [
      { id: 'shpagat', name: 'שפגט', type: 'bar' },
      { id: 'radio-epgb', name: 'Radio EPGB', type: 'club' },
      { id: 'kuli-alma', name: 'Kuli Alma', type: 'club' },
    ],
    plannedCount: 67,
    activeCount: 45,
    historicalAvg: 120,
    image: '/rothschild.jpg'
  },
  {
    id: 'tlv-florentin',
    name: 'פלורנטין',
    nameEn: 'Florentin',
    city: 'תל אביב',
    location: { lat: 32.0560, lng: 34.7650 },
    radius: 500,
    venues: [
      { id: 'sputnik', name: 'Sputnik', type: 'bar' },
      { id: 'romano', name: 'Romano', type: 'bar' },
      { id: 'teder', name: 'Teder.fm', type: 'club' },
    ],
    plannedCount: 52,
    activeCount: 38,
    historicalAvg: 95,
    image: '/florentin.jpg'
  },
  {
    id: 'tlv-port',
    name: 'נמל תל אביב',
    nameEn: 'Tel Aviv Port',
    city: 'תל אביב',
    location: { lat: 32.0972, lng: 34.7745 },
    radius: 400,
    venues: [
      { id: 'shablul', name: 'שבלול', type: 'club' },
      { id: 'clara', name: 'Clara', type: 'club' },
    ],
    plannedCount: 41,
    activeCount: 28,
    historicalAvg: 80,
    image: '/tlv-port.jpg'
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// Special Events Data
// ═══════════════════════════════════════════════════════════════════════════

const getNextFriday = () => {
  const today = new Date();
  const friday = new Date(today);
  const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
  friday.setDate(today.getDate() + daysUntilFriday);
  friday.setHours(22, 0, 0, 0);
  return friday;
};

const getNextSaturday = () => {
  const friday = getNextFriday();
  const saturday = new Date(friday);
  saturday.setDate(friday.getDate() + 1);
  return saturday;
};

const specialEvents = [
  {
    id: 'archie-singles-night',
    name: 'ערב סינגלים 🦎',
    venueName: 'Archie Bar',
    venueId: 'archie-bar',
    zoneId: 'ashkelon-delila',
    description: 'ערב סינגלים מיוחד עם I4IGUANA! הכירו אנשים חדשים בצורה כיפית ומפתיעה.',
    date: admin.firestore.Timestamp.fromDate(getNextFriday()),
    time: '22:00',
    plannedCount: 34,  // FOMO!
    perks: ['שוט חינם למאצ\'ים!', 'הנחה 20% על קוקטיילים'],
    location: { lat: 31.6650, lng: 34.5450 },
    image: '/archie-event.jpg',
    isActive: true
  },
  {
    id: 'marina-weekend',
    name: 'Weekend Vibes 🌅',
    venueName: 'Marina Café',
    venueId: 'marina-cafe',
    zoneId: 'ashkelon-marina',
    description: 'שישי במרינה - מוזיקה, אווירה ושקיעה מושלמת!',
    date: admin.firestore.Timestamp.fromDate(getNextFriday()),
    time: '18:00',
    plannedCount: 28,
    perks: ['Happy Hour עד 20:00'],
    location: { lat: 31.6696, lng: 34.5566 },
    image: '/marina-event.jpg',
    isActive: true
  },
  {
    id: 'florentin-party',
    name: 'Florentin Night 🎉',
    venueName: 'Sputnik',
    venueId: 'sputnik',
    zoneId: 'tlv-florentin',
    description: 'מסיבת סינגלים בפלורנטין - הלילה הכי שווה בתל אביב!',
    date: admin.firestore.Timestamp.fromDate(getNextSaturday()),
    time: '23:00',
    plannedCount: 56,
    perks: ['כניסה חינם לרשומים', 'DJ Set מיוחד'],
    location: { lat: 32.0560, lng: 34.7650 },
    image: '/florentin-event.jpg',
    isActive: true
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// Zone Planned Data (for FOMO!)
// ═══════════════════════════════════════════════════════════════════════════

const zonePlannedData = entertainmentZones.map(zone => ({
  zoneId: zone.id,
  count: zone.plannedCount,
  users: [], // Will be populated when users click "אני מגיע"
  lastUpdated: admin.firestore.Timestamp.now()
}));

// ═══════════════════════════════════════════════════════════════════════════
// Seed Functions
// ═══════════════════════════════════════════════════════════════════════════

async function seedEntertainmentZones() {
  console.log('🗺️ Seeding entertainment zones...');
  
  const batch = db.batch();
  
  for (const zone of entertainmentZones) {
    const ref = db.collection('entertainmentZones').doc(zone.id);
    batch.set(ref, {
      ...zone,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });
    console.log(`  ✅ ${zone.name} (${zone.city})`);
  }
  
  await batch.commit();
  console.log(`✅ Seeded ${entertainmentZones.length} zones\n`);
}

async function seedSpecialEvents() {
  console.log('🎉 Seeding special events...');
  
  const batch = db.batch();
  
  for (const event of specialEvents) {
    const ref = db.collection('events').doc(event.id);
    batch.set(ref, {
      ...event,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });
    console.log(`  ✅ ${event.name} at ${event.venueName}`);
  }
  
  await batch.commit();
  console.log(`✅ Seeded ${specialEvents.length} events\n`);
}

async function seedZonePlanned() {
  console.log('👥 Seeding zone planned counts (FOMO!)...');
  
  const batch = db.batch();
  
  for (const data of zonePlannedData) {
    const ref = db.collection('zonePlanned').doc(data.zoneId);
    batch.set(ref, data);
    console.log(`  ✅ ${data.zoneId}: ${data.count} planned`);
  }
  
  await batch.commit();
  console.log(`✅ Seeded planned counts for ${zonePlannedData.length} zones\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Run Seed
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n🦎 I4IGUANA - Seeding Entertainment Zones & Events\n');
  console.log('═'.repeat(60) + '\n');
  
  try {
    await seedEntertainmentZones();
    await seedSpecialEvents();
    await seedZonePlanned();
    
    console.log('═'.repeat(60));
    console.log('🎉 All data seeded successfully!');
    console.log('═'.repeat(60));
    console.log('\nNow you can test the Action Tonight screen! 🔥\n');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
  
  process.exit(0);
}

main();
