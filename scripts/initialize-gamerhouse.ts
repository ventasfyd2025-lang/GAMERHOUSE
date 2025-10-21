import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
});

const db = admin.firestore();

async function initializeGamerhouse() {
  console.log('🎮 Inicializando GAMERHOUSE en Firebase...\n');

  try {
    // 1. Crear categorías
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

    for (const category of categories) {
      await db.collection('gamerhouse_categorias').doc(category.id).set(category);
      console.log(`  ✅ Categoría: ${category.name}`);
    }

    // 2. Crear productos de ejemplo
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
      },
      {
        nombre: 'Xbox Series X',
        precio: 499.99,
        stock: 12,
        categoria: 'xbox-series',
        imagen: 'https://via.placeholder.com/300x300?text=Xbox+Series+X',
        descripcion: 'Consola Xbox Series X de última generación',
        tienda: 'gamerhouse',
      },
      {
        nombre: 'Nintendo Switch OLED',
        precio: 349.99,
        stock: 20,
        categoria: 'nintendo-switch',
        imagen: 'https://via.placeholder.com/300x300?text=Nintendo+Switch',
        descripcion: 'Nintendo Switch modelo OLED con pantalla mejorada',
        tienda: 'gamerhouse',
      },
      {
        nombre: 'Pokémon Scarlet',
        precio: 59.99,
        stock: 30,
        categoria: 'pokemon',
        imagen: 'https://via.placeholder.com/300x300?text=Pokemon+Scarlet',
        descripcion: 'Pokémon Scarlet para Nintendo Switch',
        tienda: 'gamerhouse',
      },
      {
        nombre: 'Control DualSense',
        precio: 74.99,
        stock: 25,
        categoria: 'accesorios',
        imagen: 'https://via.placeholder.com/300x300?text=DualSense',
        descripcion: 'Control DualSense para PlayStation 5',
        tienda: 'gamerhouse',
      },
    ];

    for (const product of products) {
      const docRef = await db.collection('gamerhouse_products').add({
        ...product,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`  ✅ Producto: ${product.nombre} (ID: ${docRef.id})`);
    }

    // 3. Crear documento de configuración
    console.log('\n⚙️ Creando configuración...');
    await db.collection('gamerhouse_config').doc('store').set({
      nombre: 'GAMERHOUSE',
      descripcion: 'Tu tienda de videojuegos y gaming',
      email: 'info@gamerhouse.com',
      telefono: '+56 9 XXXX XXXX',
      direccion: 'Santiago, Chile',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('  ✅ Configuración creada');

    console.log('\n✨ ¡GAMERHOUSE inicializado correctamente en Firebase!');
    console.log('\n📊 Resumen:');
    console.log(`   - Categorías creadas: ${categories.length}`);
    console.log(`   - Productos de ejemplo: ${products.length}`);
    console.log('\n🚀 Ya puedes usar GAMERHOUSE con datos iniciales!');

  } catch (error) {
    console.error('❌ Error inicializando GAMERHOUSE:', error);
  } finally {
    admin.app().delete();
  }
}

initializeGamerhouse();
