/**
 * 🦎 I4IGUANA - Dummy Users Service
 * 
 * Creates realistic fake profiles to populate entertainment zones
 * 
 * Rules:
 * - Real users ALWAYS shown first
 * - Dummies fill the gallery after real users
 * - Like on dummy = disappears forever
 * - Pass on dummy = returns after 3 days
 * - Max 50 dummies per day per user
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  updateDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from './firebase'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface DummyUser {
  oderId: string
  name: string
  age: number
  gender: 'male' | 'female'
  photos: string[]
  bio: string
  hobbies: string[]
  height?: number
  occupation?: string
  education?: string
  drinking?: string
  smoking?: string
  lookingFor?: 'relationship' | 'casual' | 'friends'  // ✅ v2.8.28: Relationship type
  city?: string
  
  // Dummy-specific fields
  isDummy: true
  dummyZone: string  // 'florentin' | 'ashkelon' etc.
  
  // Location within zone
  location: {
    latitude: number
    longitude: number
    geohash: string
  }
  
  isAvailable: boolean
  createdAt: Timestamp
}

export interface DummyInteraction {
  oderId: string       // User who interacted
  dummyId: string      // Dummy profile ID
  action: 'like' | 'pass'
  timestamp: Timestamp
  expiresAt?: Timestamp  // For pass - when it can reappear
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const PASS_COOLDOWN_DAYS = 3
const MAX_DUMMIES_PER_SESSION = 50

// Zone centers - NATIONAL COVERAGE! 🇮🇱
const ZONE_CENTERS: { [key: string]: { lat: number; lng: number } } = {
  // ══════════════════════════════════════════════════════════════════════════
  // 🏖️ ASHKELON
  // ══════════════════════════════════════════════════════════════════════════
  'ashkelon-marina': { lat: 31.682, lng: 34.555 },
  'ashkelon-delila': { lat: 31.6654, lng: 34.5489 },
  'ashkelon-barnea': { lat: 31.6612, lng: 34.5678 },
  'ashkelon-city-center': { lat: 31.6688, lng: 34.5743 },
  'nir-home': { lat: 31.6969951, lng: 34.5778336 },
  'ashkelon-hanasi': { lat: 31.6680, lng: 34.5620 },
  'ashkelon': { lat: 31.6688, lng: 34.5743 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🌊 ASHDOD
  // ══════════════════════════════════════════════════════════════════════════
  'ashdod-city': { lat: 31.8044, lng: 34.6553 },
  'ashdod-marina': { lat: 31.8218, lng: 34.6382 },
  'ashdod-rova-vav': { lat: 31.7897, lng: 34.6489 },
  'ashdod': { lat: 31.8044, lng: 34.6553 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🏜️ BEER SHEVA
  // ══════════════════════════════════════════════════════════════════════════
  'bsheva-old-city': { lat: 31.2431, lng: 34.7994 },
  'bsheva-big': { lat: 31.2644, lng: 34.8097 },
  'bsheva-rager': { lat: 31.2520, lng: 34.7830 },
  'beer-sheva': { lat: 31.2530, lng: 34.7915 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🏝️ EILAT
  // ══════════════════════════════════════════════════════════════════════════
  'eilat-promenade': { lat: 29.5517, lng: 34.9508 },
  'eilat-hotel-strip': { lat: 29.5450, lng: 34.9480 },
  'eilat-north-beach': { lat: 29.5577, lng: 34.9519 },
  'eilat': { lat: 29.5577, lng: 34.9519 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🔬 REHOVOT
  // ══════════════════════════════════════════════════════════════════════════
  'rehovot-science-park': { lat: 31.91277, lng: 34.804205 },
  'rehovot-science': { lat: 31.91277, lng: 34.804205 },  // Alias
  'rehovot-herzl': { lat: 31.897, lng: 34.807 },
  'rehovot': { lat: 31.91277, lng: 34.804205 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🏙️ TEL AVIV
  // ══════════════════════════════════════════════════════════════════════════
  'tlv-florentin': { lat: 32.0544, lng: 34.7678 },
  'florentin': { lat: 32.0544, lng: 34.7678 },  // Alias
  'tlv-rothschild': { lat: 32.0636, lng: 34.7731 },
  'tlv-port': { lat: 32.0972, lng: 34.7747 },
  'tlv-dizengoff': { lat: 32.0778, lng: 34.7744 },
  'tlv-neve-tzedek': { lat: 32.0589, lng: 34.7650 },
  'tlv-carmel-market': { lat: 32.0680, lng: 34.7660 },
  'tlv-arbaa': { lat: 32.0703, lng: 34.7856 },
  'tlv-station': { lat: 32.0561, lng: 34.7567 },
  'tlv-allenby': { lat: 32.0667, lng: 34.7694 },
  
  // ══════════════════════════════════════════════════════════════════════════
  // 💎 RAMAT GAN
  // ══════════════════════════════════════════════════════════════════════════
  'rg-bursa': { lat: 32.0845, lng: 34.8088 },
  'rg-ayalon': { lat: 32.0680, lng: 34.8248 },
  'rg-city-center': { lat: 32.0719, lng: 34.8160 },
  'ramat-gan': { lat: 32.0680, lng: 34.8248 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🏡 GIVATAYIM
  // ══════════════════════════════════════════════════════════════════════════
  'givatayim-center': { lat: 32.0719, lng: 34.8119 },
  'givatayim': { lat: 32.0719, lng: 34.8119 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 💻 HERZLIYA
  // ══════════════════════════════════════════════════════════════════════════
  'herzliya-pituach': { lat: 32.1663, lng: 34.8088 },
  'herzliya-marina': { lat: 32.1617, lng: 34.7967 },
  'herzliya-arena': { lat: 32.1580, lng: 34.8050 },
  'herzliya': { lat: 32.1663, lng: 34.8442 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🌊 NETANYA
  // ══════════════════════════════════════════════════════════════════════════
  'netanya-promenade': { lat: 32.3290, lng: 34.8510 },
  'netanya-city-center': { lat: 32.3215, lng: 34.8532 },
  'netanya-poleg': { lat: 32.2850, lng: 34.8350 },
  'netanya': { lat: 32.3215, lng: 34.8532 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🌳 RAANANA
  // ══════════════════════════════════════════════════════════════════════════
  'raanana-ahuza': { lat: 32.1836, lng: 34.8706 },
  'raanana-park': { lat: 32.1900, lng: 34.8750 },
  'raanana': { lat: 32.1836, lng: 34.8706 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🏘️ KFAR SABA
  // ══════════════════════════════════════════════════════════════════════════
  'kfar-saba-weizmann': { lat: 32.1780, lng: 34.9066 },
  'kfar-saba-center': { lat: 32.1750, lng: 34.9100 },
  'kfar-saba': { lat: 32.1780, lng: 34.9066 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🏙️ PETAH TIKVA
  // ══════════════════════════════════════════════════════════════════════════
  'pt-rothschild': { lat: 32.0900, lng: 34.8850 },
  'pt-em-hamoshavot': { lat: 32.0841, lng: 34.8878 },
  'pt-big': { lat: 32.1000, lng: 34.8700 },
  'pt-hashaham': { lat: 32.0920, lng: 34.8730 },  // HaShaham - bars district
  'petah-tikva': { lat: 32.0841, lng: 34.8878 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🌆 RISHON LEZION
  // ══════════════════════════════════════════════════════════════════════════
  'rishon-rothschild': { lat: 31.9650, lng: 34.8050 },
  'rishon-rishonim': { lat: 31.9730, lng: 34.7925 },
  'rishon-west': { lat: 31.9800, lng: 34.7700 },
  'rishon-lezion': { lat: 31.9730, lng: 34.7925 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🏡 HOLON
  // ══════════════════════════════════════════════════════════════════════════
  'holon-sokolov': { lat: 32.0110, lng: 34.7748 },
  'holon-center': { lat: 32.0150, lng: 34.7800 },
  'holon': { lat: 32.0110, lng: 34.7748 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🏖️ BAT YAM
  // ══════════════════════════════════════════════════════════════════════════
  'bat-yam-beach': { lat: 32.0171, lng: 34.7420 },
  'bat-yam-center': { lat: 32.0200, lng: 34.7510 },
  'bat-yam': { lat: 32.0171, lng: 34.7510 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🏘️ NES ZIONA
  // ══════════════════════════════════════════════════════════════════════════
  'nes-ziona-center': { lat: 31.9293, lng: 34.7985 },
  'nes-ziona': { lat: 31.9293, lng: 34.7985 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🏙️ MODIIN
  // ══════════════════════════════════════════════════════════════════════════
  'modiin-azrieli': { lat: 31.8969, lng: 35.0104 },
  'modiin-ligad': { lat: 31.9100, lng: 35.0050 },
  'modiin': { lat: 31.8969, lng: 35.0104 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🏛️ JERUSALEM
  // ══════════════════════════════════════════════════════════════════════════
  'jlm-mahane-yehuda': { lat: 31.7847, lng: 35.2124 },
  'jlm-german-colony': { lat: 31.7589, lng: 35.2219 },
  'jlm-first-station': { lat: 31.7583, lng: 35.2236 },
  'jlm-nahalat-shiva': { lat: 31.7805, lng: 35.2210 },
  'jlm-talbiya': { lat: 31.7650, lng: 35.2150 },
  'jlm-emek-refaim': { lat: 31.7600, lng: 35.2200 },
  'jerusalem': { lat: 31.7683, lng: 35.2137 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🏛️ BEIT SHEMESH
  // ══════════════════════════════════════════════════════════════════════════
  'beit-shemesh-center': { lat: 31.7513, lng: 34.9877 },
  'beit-shemesh': { lat: 31.7513, lng: 34.9877 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // ⛰️ HAIFA
  // ══════════════════════════════════════════════════════════════════════════
  'haifa-downtown': { lat: 32.8191, lng: 34.9983 },
  'haifa-carmel': { lat: 32.7940, lng: 34.9896 },
  'haifa-german-colony': { lat: 32.8225, lng: 34.9867 },
  'haifa-masada': { lat: 32.8090, lng: 34.9920 },
  'haifa-bat-galim': { lat: 32.8300, lng: 34.9600 },
  'haifa': { lat: 32.7940, lng: 34.9896 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🍷 ZICHRON YAAKOV
  // ══════════════════════════════════════════════════════════════════════════
  'zichron-midrahov': { lat: 32.5714, lng: 34.9544 },
  'zichron-wineries': { lat: 32.5680, lng: 34.9510 },
  'zichron-yaakov': { lat: 32.5714, lng: 34.9544 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🏔️ NORTH
  // ══════════════════════════════════════════════════════════════════════════
  'nahariya-gaaton': { lat: 33.0057, lng: 35.0978 },
  'nahariya-beach': { lat: 33.0100, lng: 35.0900 },
  'nahariya': { lat: 33.0057, lng: 35.0978 },  // Alias
  
  'acre-old-city': { lat: 32.9272, lng: 35.0764 },
  'acre-beach': { lat: 32.9300, lng: 35.0700 },
  'acre': { lat: 32.9272, lng: 35.0764 },  // Alias
  
  'kiryat-shmona-center': { lat: 33.2075, lng: 35.5697 },
  'kiryat-shmona': { lat: 33.2075, lng: 35.5697 },  // Alias
  
  'tiberias-promenade': { lat: 32.7900, lng: 35.5380 },
  'tiberias-center': { lat: 32.7957, lng: 35.5320 },
  'tiberias': { lat: 32.7957, lng: 35.5320 },  // Alias
  
  'safed-old-city': { lat: 32.9646, lng: 35.4962 },
  'safed-artists': { lat: 32.9670, lng: 35.4980 },
  'safed': { lat: 32.9646, lng: 35.4962 },  // Alias
  
  'karmiel-center': { lat: 32.9193, lng: 35.2961 },
  'karmiel': { lat: 32.9193, lng: 35.2961 },  // Alias
  
  'nazareth-old-city': { lat: 32.7000, lng: 35.2970 },
  'nazareth-center': { lat: 32.6996, lng: 35.3035 },
  'nazareth': { lat: 32.6996, lng: 35.3035 },  // Alias
  
  'afula-center': { lat: 32.6100, lng: 35.2903 },
  'afula-yula-bar': { lat: 32.6096, lng: 35.2897 },  // ✅ יולה בר - החשמל 3, עפולה
  'afula': { lat: 32.6100, lng: 35.2903 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🌳 TEL ADASHIM - עמק יזרעאל
  // ══════════════════════════════════════════════════════════════════════════
  'tel-adashim-kachol-yarok': { lat: 32.5971, lng: 35.1967 },  // ✅ כחול וירוק גן אירועים
  'tel-adashim': { lat: 32.5971, lng: 35.1967 },  // Alias
  
  // ══════════════════════════════════════════════════════════════════════════
  // 🏜️ SOUTH EXTRAS
  // ══════════════════════════════════════════════════════════════════════════
  'kiryat-gat-center': { lat: 31.6100, lng: 34.7642 },
  'kiryat-gat': { lat: 31.6100, lng: 34.7642 },  // Alias
  
  'dimona-center': { lat: 31.0697, lng: 35.0328 },
  'dimona': { lat: 31.0697, lng: 35.0328 }  // Alias
}

// ═══════════════════════════════════════════════════════════════════════════
// NAME POOLS - Diverse Israeli Names
// ═══════════════════════════════════════════════════════════════════════════

const FEMALE_NAMES = [
  // Classic Israeli
  "נועה", "שירה", "מיכל", "רונית", "ליאת", "עדי", "מאיה", "דנה",
  "יעל", "תמר", "שני", "רוני", "הילה", "גלי", "ליהי", "עינב",
  "מור", "טל", "אור", "שקד", "רותם", "אגם", "ים", "נגה",
  "לירון", "ליאור", "עמית", "נעמה", "חן", "שלי", "קרן", "ענבר",
  "איילת", "אפרת", "מירב", "ורד", "סיון", "שרון", "לימור", "גילי",
  
  // New immigrants / diverse
  "אנה", "ניקול", "מריה", "סופיה", "אלינה", "קטיה", "ויקטוריה",
  "נטלי", "אמילי", "מישל", "אלכסנדרה", "דיאנה", "יוליה", "אירינה",
  "מרינה", "אולגה", "אנסטסיה", "ורוניקה", "סבטלנה", "אלנה",
  
  // Ethiopian
  "אדן", "סלמה", "מסרט", "ברכה", "צגה", "אסתר", "אלמז", "טיגיסט",
  
  // Arabic - Expanded for northern cities
  "נור", "לין", "סלמא", "רנא", "דינא", "יאסמין", "מירנא", "רים",
  "לילי", "מאיסה", "הנאא", "סמאח", "רנין", "סנאא", "ראניה", "דאליה",
  "מריאם", "פאטמה", "עביר", "הבה", "נסרין", "רוזלין", "ג'ומאנה", "למא"
]

const MALE_NAMES = [
  // Classic Israeli
  "דניאל", "יונתן", "עומר", "איתי", "רון", "גיא", "אורי", "ניר",
  "תומר", "אסף", "יובל", "עידו", "אלון", "שחר", "מתן", "דור",
  "רועי", "אייל", "עמית", "ליאור", "טל", "נדב", "גל", "בר",
  "עדן", "יואב", "אריאל", "נועם", "שי", "אביב", "רן", "גיל",
  "ערן", "עופר", "אמיר", "דביר", "יניב", "אלעד", "עידן", "אורן",
  
  // New immigrants / diverse
  "אלכס", "מקסים", "דמיטרי", "ויקטור", "אנדריי", "סרגיי",
  "דויד", "מייקל", "כריס", "דן", "ניק", "מארק", "אנטון",
  "איגור", "בוריס", "רומן", "ולדימיר", "אלכסיי", "פאבל",
  
  // Ethiopian
  "אברהם", "משה", "דוד", "יוסף", "שלמה", "דניאל", "בירוק", "טדסה",
  
  // Arabic - Expanded for northern cities
  "אדם", "סאמי", "ראמי", "טארק", "כרים", "אמיר", "מוחמד", "עומר",
  "חאלד", "באסם", "מרואן", "וליד", "ראיד", "נאדר", "פאדי", "ג'מאל",
  "יוסף", "עלי", "חסן", "אחמד", "מאזן", "אימאד", "סאמר", "ראיף"
]

// ═══════════════════════════════════════════════════════════════════════════
// BIO & HOBBY POOLS
// ═══════════════════════════════════════════════════════════════════════════

const BIOS_FEMALE = [
  "אוהבת לגלות מקומות חדשים ולפגוש אנשים מעניינים 🌟",
  "קפה טוב, שיחה טובה, חברה טובה ☕",
  "חיים פעם אחת - בואו ניהנה! 💃",
  "מחפשת מישהו עם חוש הומור ולב טוב",
  "Foodie, traveler, dreamer ✨",
  "בין הים להרים, תמיד בדרך להרפתקה 🏖️",
  "מאמינה בקסם של רגעים קטנים",
  "סטודנטית ביום, אוהבת חיים בלילה 🌙",
  "חיוך זה הדבר הכי יפה שאפשר ללבוש 😊",
  "אופטימית כרונית, מחפשת שותף לאופטימיות",
  "ספרים, יין, ושיחות עד הלילה 📚🍷",
  "רוקדת בגשם ומחייכת לזרים",
  "מחפשת את זה שיגרום לי לצחוק",
  "תל אביבית עד העצם 🌴",
  "בואו נגלה את העיר ביחד"
]

const BIOS_MALE = [
  "פשוט מחפש מישהי אמיתית 🎯",
  "אוהב ספורט, מוזיקה וערבים עם חברים",
  "היי-טק ביום, DJ בלילה 🎧",
  "מאמין שצחוק זה הסוד לכל דבר",
  "גולש, מטייל, חי את הרגע 🏄",
  "אוכל טוב = לב שמח 🍕",
  "מחפש שותפה להרפתקאות",
  "Chill vibes only ✌️",
  "ביום עבודה קשה, בערב נהנה קשה 💪",
  "אוהב לבשל, מי בא לטעום? 👨‍🍳",
  "מוזיקה, קפה, שקיעות על הים",
  "סקרן, אופטימי, תמיד מחייך",
  "בוא נתחיל מקפה ונראה לאן זה הולך ☕",
  "פלורנטין הוא הבית שלי 🏠",
  "מחפש את השניה הטובה שלי"
]

const HOBBIES = [
  "fitness", "yoga", "running", "swimming", "surfing",
  "music", "guitar", "piano", "singing", "dancing",
  "cooking", "baking", "wine", "coffee", "foodie",
  "travel", "hiking", "camping", "beach", "nature",
  "reading", "writing", "art", "photography", "movies",
  "gaming", "tech", "startups", "coding", "design",
  "dogs", "cats", "animals", "volunteering", "meditation"
]

const OCCUPATIONS = [
  "Software Developer", "Product Manager", "Designer", "Marketing",
  "Student", "Teacher", "Lawyer", "Doctor", "Nurse",
  "Chef", "Bartender", "Photographer", "Artist", "Musician",
  "Entrepreneur", "Consultant", "Sales", "HR", "Finance",
  "Personal Trainer", "Yoga Instructor", "Real Estate", "Architect"
]

const EDUCATIONS = [
  "Tel Aviv University", "Hebrew University", "Technion",
  "Ben Gurion University", "Bar Ilan University", "IDC Herzliya",
  "Bezalel Academy", "Shenkar College", "College of Management"
]

// ═══════════════════════════════════════════════════════════════════════════
// PHOTO URLS - Using randomuser.me API format
// These will be replaced with actual generated photos
// ═══════════════════════════════════════════════════════════════════════════

const getPhotoUrl = (gender: 'male' | 'female', index: number): string => {
  // Using randomuser.me for realistic photos
  // In production, replace with generated.photos URLs
  const genderPath = gender === 'male' ? 'men' : 'women'
  return `https://randomuser.me/api/portraits/${genderPath}/${index % 100}.jpg`
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate random location within zone radius
 */
const generateLocationInZone = (
  centerLat: number, 
  centerLng: number, 
  minDistance: number = 50,
  maxDistance: number = 500
): { latitude: number; longitude: number; geohash: string } => {
  // Random distance between min and max meters
  const distance = minDistance + Math.random() * (maxDistance - minDistance)
  
  // Random angle
  const angle = Math.random() * 2 * Math.PI
  
  // Convert to lat/lng offset (rough approximation)
  const latOffset = (distance / 111000) * Math.cos(angle)
  const lngOffset = (distance / (111000 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle)
  
  const latitude = centerLat + latOffset
  const longitude = centerLng + lngOffset
  
  // Generate simple geohash (first 6 chars)
  const geohash = generateGeohash(latitude, longitude)
  
  return { latitude, longitude, geohash }
}

/**
 * Simple geohash generator
 */
const generateGeohash = (lat: number, lng: number): string => {
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz'
  let geohash = ''
  let minLat = -90, maxLat = 90
  let minLng = -180, maxLng = 180
  let isLng = true
  
  for (let i = 0; i < 6; i++) {
    let idx = 0
    for (let bit = 4; bit >= 0; bit--) {
      if (isLng) {
        const mid = (minLng + maxLng) / 2
        if (lng >= mid) {
          idx |= (1 << bit)
          minLng = mid
        } else {
          maxLng = mid
        }
      } else {
        const mid = (minLat + maxLat) / 2
        if (lat >= mid) {
          idx |= (1 << bit)
          minLat = mid
        } else {
          maxLat = mid
        }
      }
      isLng = !isLng
    }
    geohash += base32[idx]
  }
  
  return geohash
}

/**
 * Get random items from array
 */
const getRandomItems = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Get random item from array
 */
const getRandom = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Get random number in range
 */
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ═══════════════════════════════════════════════════════════════════════════
// DUMMY GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a single dummy profile
 */
export const generateDummyProfile = (
  gender: 'male' | 'female',
  zone: string,
  index: number
): DummyUser => {
  const names = gender === 'male' ? MALE_NAMES : FEMALE_NAMES
  const bios = gender === 'male' ? BIOS_MALE : BIOS_FEMALE
  const zoneCenter = ZONE_CENTERS[zone] || ZONE_CENTERS['tlv-florentin']
  
  const name = names[index % names.length]
  const age = getRandomInt(26, 50)  // ✅ v2.8.7: Updated age range per Nir's request
  const location = generateLocationInZone(zoneCenter.lat, zoneCenter.lng)
  
  // ✅ v2.8.10: Use only 1 photo per dummy to avoid "fake" look
  // Multiple photos from randomuser.me are different people!
  const photos: string[] = [getPhotoUrl(gender, index % 100)]
  
  // ✅ v2.8.5 FIX: Detect city correctly based on zone
  const detectCity = (zoneId: string): string => {
    if (zoneId.includes('tlv') || zoneId.includes('florentin') || zoneId.includes('rothschild')) return 'tel-aviv'
    if (zoneId.includes('rehovot')) return 'rehovot'
    if (zoneId.includes('jlm') || zoneId.includes('jerusalem')) return 'jerusalem'
    if (zoneId.includes('haifa')) return 'haifa'
    return 'ashkelon'  // Default to Ashkelon
  }
  
  return {
    oderId: `dummy_${gender[0]}_${zone}_${String(index).padStart(3, '0')}`,
    name,
    age,
    gender,
    photos,
    bio: getRandom(bios),
    hobbies: getRandomItems(HOBBIES, getRandomInt(3, 6)),
    height: gender === 'male' ? getRandomInt(170, 190) : getRandomInt(155, 175),
    occupation: getRandom(OCCUPATIONS),
    education: getRandom(EDUCATIONS),
    drinking: getRandom(['never', 'socially', 'often']),
    smoking: getRandom(['never', 'socially', 'often']),
    lookingFor: getRandom(['relationship', 'casual', 'friends']),  // ✅ v2.8.28: Variety of relationship types
    city: detectCity(zone),  // ✅ v2.8.5 FIX: Use correct city ID format
    
    isDummy: true,
    dummyZone: zone,
    
    location,
    isAvailable: true,
    createdAt: Timestamp.now()
  }
}

/**
 * Generate all dummy profiles for a zone
 */
export const generateDummiesForZone = (
  zone: string,
  maleCount: number = 100,
  femaleCount: number = 100
): DummyUser[] => {
  console.log(`🤖 Generating ${maleCount + femaleCount} dummy profiles for ${zone}...`)
  
  const dummies: DummyUser[] = []
  
  // Generate males
  for (let i = 0; i < maleCount; i++) {
    dummies.push(generateDummyProfile('male', zone, i))
  }
  
  // Generate females
  for (let i = 0; i < femaleCount; i++) {
    dummies.push(generateDummyProfile('female', zone, i))
  }
  
  console.log(`✅ Generated ${dummies.length} dummy profiles`)
  return dummies
}

// ═══════════════════════════════════════════════════════════════════════════
// FIREBASE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Upload dummy profiles to Firebase
 */
export const uploadDummiesToFirebase = async (
  dummies: DummyUser[]
): Promise<number> => {
  console.log(`📤 Uploading ${dummies.length} dummies to Firebase...`)
  
  const batch = writeBatch(db)
  let count = 0
  
  for (const dummy of dummies) {
    const docRef = doc(db, 'dummyUsers', dummy.oderId)
    batch.set(docRef, dummy)
    count++
    
    // Firestore batch limit is 500
    if (count % 500 === 0) {
      await batch.commit()
      console.log(`   Uploaded ${count}/${dummies.length}`)
    }
  }
  
  // Commit remaining
  if (count % 500 !== 0) {
    await batch.commit()
  }
  
  console.log(`✅ Uploaded ${count} dummies to Firebase`)
  return count
}

/**
 * Get dummies for a zone, filtered by user interactions
 */
export const getDummiesForUser = async (
  oderId: string,
  zone: string,
  userGender: 'male' | 'female',
  lookingFor: 'male' | 'female' | 'both',
  limit: number = MAX_DUMMIES_PER_SESSION,
  ageRange?: [number, number]  // ✅ v2.8.6: Age range filter
): Promise<DummyUser[]> => {
  try {
    console.log(`🤖 Loading dummies for zone ${zone}...`)
    console.log(`   Looking for: ${lookingFor}`)
    console.log(`   Age range filter: ${ageRange ? `${ageRange[0]}-${ageRange[1]}` : 'none'}`)
    
    // ✅ v2.8.17: Fallback zones for areas without dummies
    const ZONE_FALLBACKS: Record<string, string[]> = {
      'nir-home': ['ashkelon-marina', 'ashkelon-city-center', 'ashkelon'],
      'ashkelon-barnea': ['ashkelon-marina', 'ashkelon-city-center', 'ashkelon'],
      'ashkelon-delila': ['ashkelon-marina', 'ashkelon-city-center', 'ashkelon'],
      'ashkelon-hanasi': ['ashkelon-marina', 'ashkelon-city-center', 'ashkelon'],
      'rehovot-herzl': ['rehovot-science-park', 'rehovot'],
    }
    
    // Try the requested zone first, then fallbacks
    const zonesToTry = [zone, ...(ZONE_FALLBACKS[zone] || [])]
    
    let dummies: DummyUser[] = []
    let usedZone = zone
    
    for (const tryZone of zonesToTry) {
      console.log(`   Trying zone: ${tryZone}...`)
      
      // ✅ v2.8.6 FIX: Handle 'both' properly - fetch BOTH genders!
      if (lookingFor === 'both') {
        console.log(`   🌈 BOTH mode - fetching males AND females...`)
        
        // Fetch males
        const malesRef = collection(db, 'dummyUsers')
        const malesQuery = query(
          malesRef,
          where('dummyZone', '==', tryZone),
          where('gender', '==', 'male'),
          where('isAvailable', '==', true)
        )
        const malesSnap = await getDocs(malesQuery)
        const males: DummyUser[] = []
        malesSnap.forEach(doc => males.push(doc.data() as DummyUser))
        
        // Fetch females
        const femalesRef = collection(db, 'dummyUsers')
        const femalesQuery = query(
          femalesRef,
          where('dummyZone', '==', tryZone),
          where('gender', '==', 'female'),
          where('isAvailable', '==', true)
        )
        const femalesSnap = await getDocs(femalesQuery)
        const females: DummyUser[] = []
        femalesSnap.forEach(doc => females.push(doc.data() as DummyUser))
        
        // Combine both genders
        dummies = [...males, ...females]
        console.log(`   Found ${males.length} males + ${females.length} females = ${dummies.length} total in ${tryZone}`)
        
      } else {
        // Single gender - original logic
        const targetGender = lookingFor
        
        const dummiesRef = collection(db, 'dummyUsers')
        const q = query(
          dummiesRef,
          where('dummyZone', '==', tryZone),
          where('gender', '==', targetGender),
          where('isAvailable', '==', true)
        )
        
        const snapshot = await getDocs(q)
        dummies = []
        snapshot.forEach(doc => {
          dummies.push(doc.data() as DummyUser)
        })
        
        console.log(`   Found ${dummies.length} dummies of gender ${targetGender} in ${tryZone}`)
      }
      
      // If found dummies, use this zone and stop searching
      if (dummies.length > 0) {
        usedZone = tryZone
        console.log(`✅ Using dummies from zone: ${usedZone}`)
        break
      }
    }
    
    if (dummies.length === 0) {
      console.log(`⚠️ No dummies found in any zone! Tried: ${zonesToTry.join(', ')}`)
      return []
    }
    
    // ✅ v2.8.6: Filter by age range FIRST (before other filters)
    if (ageRange && ageRange.length === 2) {
      const [minAge, maxAge] = ageRange
      const beforeFilter = dummies.length
      dummies = dummies.filter(d => {
        const age = d.age || 25  // Default age if missing
        return age >= minAge && age <= maxAge
      })
      console.log(`   Age filter ${minAge}-${maxAge}: ${beforeFilter} → ${dummies.length} dummies`)
    }
    
    // Get user's interactions to filter out liked/recently passed
    const interactionsRef = collection(db, 'dummyInteractions')
    const interactionsQuery = query(
      interactionsRef,
      where('oderId', '==', oderId)
    )
    
    const interactionsSnap = await getDocs(interactionsQuery)
    const likedIds = new Set<string>()
    const passedWithCooldown = new Set<string>()
    const now = Date.now()
    
    interactionsSnap.forEach(doc => {
      const interaction = doc.data() as DummyInteraction
      
      if (interaction.action === 'like') {
        // Liked = never show again
        likedIds.add(interaction.dummyId)
      } else if (interaction.action === 'pass' && interaction.expiresAt) {
        // Pass = check if cooldown expired
        if (interaction.expiresAt.toMillis() > now) {
          passedWithCooldown.add(interaction.dummyId)
        }
      }
    })
    
    console.log(`   User has liked ${likedIds.size} dummies`)
    console.log(`   User has ${passedWithCooldown.size} dummies on cooldown`)
    
    // Filter out liked and cooldown dummies
    dummies = dummies.filter(d => 
      !likedIds.has(d.oderId) && !passedWithCooldown.has(d.oderId)
    )
    
    // Shuffle and limit
    dummies = dummies.sort(() => Math.random() - 0.5).slice(0, limit)
    
    console.log(`✅ Returning ${dummies.length} dummies for user`)
    return dummies
    
  } catch (error) {
    console.error('❌ Error getting dummies:', error)
    return []
  }
}

/**
 * Record user interaction with dummy (like or pass)
 */
export const recordDummyInteraction = async (
  oderId: string,
  dummyId: string,
  action: 'like' | 'pass'
): Promise<void> => {
  try {
    const interactionId = `${oderId}_${dummyId}`
    const interactionRef = doc(db, 'dummyInteractions', interactionId)
    
    const interactionData: DummyInteraction = {
      oderId,
      dummyId,
      action,
      timestamp: Timestamp.now(),
    }
    
    // Add cooldown for pass
    if (action === 'pass') {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + PASS_COOLDOWN_DAYS)
      interactionData.expiresAt = Timestamp.fromDate(expiresAt)
    }
    
    await setDoc(interactionRef, interactionData)
    
    console.log(`✅ Recorded ${action} on dummy ${dummyId}`)
    
  } catch (error) {
    console.error('❌ Error recording dummy interaction:', error)
  }
}

/**
 * Check if a user ID is a dummy
 */
export const isDummyUser = (oderId: string): boolean => {
  return oderId.startsWith('dummy_')
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize dummies for a zone (run once)
 */
export const initializeDummiesForZone = async (
  zone: string,
  maleCount: number = 100,
  femaleCount: number = 100
): Promise<number> => {
  console.log(`🚀 Initializing dummies for ${zone}...`)
  
  // Check if already initialized
  const existingRef = collection(db, 'dummyUsers')
  const existingQuery = query(existingRef, where('dummyZone', '==', zone))
  const existingSnap = await getDocs(existingQuery)
  
  if (existingSnap.size > 0) {
    console.log(`⚠️ Zone ${zone} already has ${existingSnap.size} dummies`)
    return existingSnap.size
  }
  
  // Generate and upload
  const dummies = generateDummiesForZone(zone, maleCount, femaleCount)
  const count = await uploadDummiesToFirebase(dummies)
  
  return count
}

/**
 * 🌍 SEED ALL ZONES - Initialize dummies for ALL entertainment zones!
 * Run this ONCE to populate all zones with dummy users.
 * Each zone gets 50 males + 50 females = 100 profiles
 */
export const seedAllZones = async (): Promise<{ success: string[], failed: string[], total: number }> => {
  console.log('🌍 SEEDING ALL ZONES WITH DUMMIES...')
  console.log(`📊 Total zones to seed: ${Object.keys(ZONE_CENTERS).length}`)
  
  const results = { success: [] as string[], failed: [] as string[], total: 0 }
  
  // Filter out aliases (zones that point to same coordinates)
  const uniqueZones = Object.keys(ZONE_CENTERS).filter(zone => {
    // Skip aliases - they're shorter names that end without specific area
    const isAlias = !zone.includes('-') && zone !== 'florentin'
    return !isAlias
  })
  
  console.log(`📊 Unique zones (excluding aliases): ${uniqueZones.length}`)
  
  for (const zone of uniqueZones) {
    try {
      // Smaller counts for better performance: 30 males + 30 females = 60 per zone
      const count = await initializeDummiesForZone(zone, 30, 30)
      results.success.push(zone)
      results.total += count
      console.log(`✅ ${zone}: ${count} dummies`)
      
      // Small delay to avoid Firebase rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`❌ Failed to seed ${zone}:`, error)
      results.failed.push(zone)
    }
  }
  
  console.log(`\n🎉 SEEDING COMPLETE!`)
  console.log(`   ✅ Success: ${results.success.length} zones`)
  console.log(`   ❌ Failed: ${results.failed.length} zones`)
  console.log(`   📊 Total dummies: ${results.total}`)
  
  return results
}

/**
 * Get list of all available zones
 */
export const getAllZones = (): string[] => {
  return Object.keys(ZONE_CENTERS)
}
