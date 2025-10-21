// Simple script to initialize GAMERHOUSE collections in Firestore
// Run with: FIREBASE_ADMIN_PROJECT_ID=xxx FIREBASE_ADMIN_CLIENT_EMAIL=xxx FIREBASE_ADMIN_PRIVATE_KEY=xxx node scripts/init-firestore.js

const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('Asegúrate de tener:');
  console.error('- FIREBASE_ADMIN_PROJECT_ID');
  console.error('- FIREBASE_ADMIN_CLIENT_EMAIL');
  console.error('- FIREBASE_ADMIN_PRIVATE_KEY');
  process.exit(1);
}

const serviceAccount = {
  projectId,
  clientEmail,
  privateKey,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function initGamerhouse() {
  console.log('🎮 Inicializando GAMERHOUSE en Firebase...\n');

  try {
    // Categorías
    console.log('📂 Creando categorías...');
    const categories = [
      { id: 'all', name: 'Todos los Juegos', active: true, icon: '🎮' },
      { id: 'consolas', name: 'Consolas', active: true, icon: '🕹️' },
      { id: 'ps5', name: 'PlayStation 5', active: true, icon: '🎮' },
      { id: 'xbox-series', name: 'Xbox Series X|S', active: true, icon: '🎮' },
      { id: 'nintendo-switch', name: 'Nintendo Switch', active: true, icon: '🎮' },
      { id: 'juegos', name: 'Juegos', active: true, icon: '🕹️' },
      { id: 'pokemon', name: 'Pokémon', active: true, icon: '⚡' },
      { id: 'accesorios', name: 'Accesorios', active: true, icon: '🎧' },
      { id: 'merchandise', name: 'Merchandise', active: true, icon: '👕' },
    ];

    for (const cat of categories) {
      await db.collection('gamerhouse_categorias').doc(cat.id).set(cat);
      console.log(`  ✅ ${cat.name}`);
    }

    // Productos
    console.log('\n🛍️ Creando productos de ejemplo...');
    const products = [
      {
        nombre: 'PlayStation 5',
        precio: 499.99,
        stock: 15,
        categoria: 'ps5',
        imagen: 'https://via.placeholder.com/300x300?text=PS5',
        descripcion: 'Consola PlayStation 5 con SSD ultrarrápido',
        tienda: 'gamerhouse',
        createdAt: new Date(),
      },
      {
        nombre: 'Xbox Series X',
        precio: 499.99,
        stock: 12,
        categoria: 'xbox-series',
        imagen: 'https://via.placeholder.com/300x300?text=Xbox',
        descripcion: 'Consola Xbox Series X de última generación',
        tienda: 'gamerhouse',
        createdAt: new Date(),
      },
      {
        nombre: 'Nintendo Switch OLED',
        precio: 349.99,
        stock: 20,
        categoria: 'nintendo-switch',
        imagen: 'https://via.placeholder.com/300x300?text=Switch',
        descripcion: 'Nintendo Switch modelo OLED con pantalla mejorada',
        tienda: 'gamerhouse',
        createdAt: new Date(),
      },
      {
        nombre: 'Pokémon Scarlet',
        precio: 59.99,
        stock: 30,
        categoria: 'pokemon',
        imagen: 'https://via.placeholder.com/300x300?text=Pokemon',
        descripcion: 'Pokémon Scarlet para Nintendo Switch',
        tienda: 'gamerhouse',
        createdAt: new Date(),
      },
      {
        nombre: 'Control DualSense',
        precio: 74.99,
        stock: 25,
        categoria: 'accesorios',
        imagen: 'https://via.placeholder.com/300x300?text=DualSense',
        descripcion: 'Control DualSense para PlayStation 5',
        tienda: 'gamerhouse',
        createdAt: new Date(),
      },
    ];

    for (const prod of products) {
      const ref = await db.collection('gamerhouse_products').add(prod);
      console.log(`  ✅ ${prod.nombre}`);
    }

    console.log('\n✨ ¡GAMERHOUSE inicializado correctamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Categorías: ${categories.length}`);
    console.log(`   - Productos: ${products.length}`);
    console.log('\n🚀 Ya puedes usar GAMERHOUSE!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

initGamerhouse();
