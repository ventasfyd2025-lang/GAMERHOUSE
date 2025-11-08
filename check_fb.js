const admin = require('firebase-admin');
const fs = require('fs');

const envFile = '.env.local.json';
const serviceAccount = JSON.parse(fs.readFileSync(envFile, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function checkData() {
  try {
    // Get all collections
    const collections = await db.listCollections();
    console.log('📚 Colecciones en Firebase:\n');
    collections.forEach(col => console.log(`  - ${col.id}`));

    // Check gamerhouse_categorias
    console.log('\n✅ Leyendo: gamerhouse_categorias\n');
    const catSnap = await db.collection('gamerhouse_categorias').get();
    console.log(`Documentos encontrados: ${catSnap.size}\n`);
    catSnap.forEach(doc => {
      console.log(`📌 ID: "${doc.id}"`);
      console.log(JSON.stringify(doc.data(), null, 2));
      console.log('\n---\n');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkData();
