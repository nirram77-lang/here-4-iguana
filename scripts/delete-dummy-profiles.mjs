// scripts/delete-dummy-profiles.mjs
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA6laY3N84Pe_Fl1769bIoP4NbCxjmqP_o",
  authDomain: "i4iguana-89ed1.firebaseapp.com",
  projectId: "i4iguana-89ed1",
  storageBucket: "i4iguana-89ed1.firebasestorage.app",
  messagingSenderId: "143460198551",
  appId: "1:143460198551:web:5db80d325a549f3e4661d2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteDummyProfiles() {
  console.log('???  Starting to delete dummy profiles...\n');
  
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    let totalUsers = 0;
    let dummyUsers = 0;
    let deleted = 0;
    
    console.log('?? Scanning users...');
    
    const deletePromises = [];
    
    querySnapshot.forEach((docSnap) => {
      totalUsers++;
      
      // Check if UID starts with "dummy_"
      if (docSnap.id.startsWith('dummy_')) {
        dummyUsers++;
        console.log(`???  Deleting: ${docSnap.id}`);
        deletePromises.push(deleteDoc(doc(db, 'users', docSnap.id)));
      }
    });
    
    console.log(`\n?? Total users: ${totalUsers}`);
    console.log(`?? Dummy profiles found: ${dummyUsers}`);
    console.log(`\n? Deleting ${dummyUsers} profiles...`);
    
    // Delete all dummy profiles
    await Promise.all(deletePromises);
    deleted = deletePromises.length;
    
    console.log(`\n? Successfully deleted ${deleted} dummy profiles!`);
    console.log(`?? Remaining users: ${totalUsers - deleted}\n`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('? Error deleting profiles:', error);
    process.exit(1);
  }
}

deleteDummyProfiles();