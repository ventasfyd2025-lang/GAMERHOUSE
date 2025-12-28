const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { getAuth, signInAnonymously } = require('firebase/auth');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gamer-house-779ae.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gamer-house-779ae',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'gamer-house-779ae.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '833020610004',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:833020610004:web:1d9399c5c7b1eb5f9c8241'
};

if (!firebaseConfig.apiKey) {
  throw new Error('NEXT_PUBLIC_FIREBASE_API_KEY no está definida. Exporta la clave antes de ejecutar este script.');
}

async function testStorage() {
  try {
    console.log('🔥 Testing Firebase Storage...');
    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);
    const auth = getAuth(app);

    console.log('🔑 Trying anonymous auth...');
    try {
      await signInAnonymously(auth);
      console.log('✅ Anonymous auth successful');
    } catch (authError) {
      console.log('❌ Anonymous auth failed:', authError.message);
    }

    // Create a simple test file
    const testData = Buffer.from('Hello, Firebase Storage!', 'utf-8');
    const testFileName = `test/test-${Date.now()}.txt`;
    const storageRef = ref(storage, testFileName);

    console.log('📤 Attempting upload...');
    const snapshot = await uploadBytes(storageRef, testData);
    console.log('✅ Upload successful:', snapshot.metadata.name);

    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('🔗 Download URL:', downloadURL);

    return true;
  } catch (error) {
    console.error('❌ Storage test failed:', error.message);
    console.error('Error code:', error.code);
    return false;
  }
}

testStorage().then(success => {
  console.log(`\n🎯 Storage test ${success ? 'PASSED' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
});
