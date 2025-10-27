const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Initialize Firebase Admin
const admin = require('firebase-admin');
const serviceAccount = require('../.env.local.json'); // Will need to create this

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'gamer-house-779ae'
});

const db = admin.firestore();

const csvFilePath = path.join(__dirname, '../wc-product-export-11-10-2025-1760154317332.csv');

async function migrateProducts() {
  const products = [];
  const categories = new Set();

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // Parse the CSV row
        const product = {
          id: row.ID && row.ID.trim() ? row.ID.trim() : null, // Keep null for now
          sku: row.SKU || '',
          nombre: row.Nombre,
          descripcion: row.Descripción || '',
          descripcionCorta: row['Descripción corta'] || '',
          precioNormal: parseFloat(row['Precio normal']) || 0,
          precioRebajado: row['Precio rebajado'] ? parseFloat(row['Precio rebajado']) : null,
          stock: parseInt(row['¿Existencias?']) || 0,
          inventario: parseInt(row.Inventario) || 0,
          publicado: row.Publicado === '1',
          visible: row['Visibilidad en el catálogo'] === 'visible',
          peso: parseFloat(row['Peso (kg)']) || 0,
          dimensiones: {
            largo: parseFloat(row['Longitud (cm)']) || 0,
            ancho: parseFloat(row['Anchura (cm)']) || 0,
            alto: parseFloat(row['Altura (cm)']) || 0
          },
          imagenes: row.Imágenes ? row.Imágenes.split(', ').filter(img => img.trim()) : [],
          categorias: row.Categorías ? row.Categorías.split(',').map(cat => cat.trim()) : [],
          marca: row.Marcas || '',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Collect categories
        if (row.Categorías) {
          row.Categorías.split(',').forEach(cat => {
            categories.add(cat.trim());
          });
        }

        products.push(product);
      })
      .on('end', async () => {
        try {
          console.log(`Total de productos: ${products.length}`);
          console.log(`Total de categorías: ${categories.size}`);

          // Delete existing products
          const existingDocs = await db.collection('gamerhouse_products').get();
          const batch = db.batch();
          existingDocs.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          console.log('Productos existentes eliminados');

          // Upload new products in batches
          const batchSize = 100;
          for (let i = 0; i < products.length; i += batchSize) {
            const batch = db.batch();
            const chunk = products.slice(i, i + batchSize);

            chunk.forEach((product) => {
              let docRef;
              // Use product ID if available, otherwise auto-generate
              if (product.id) {
                docRef = db.collection('gamerhouse_products').doc(product.id);
              } else {
                docRef = db.collection('gamerhouse_products').doc();
                product.id = docRef.id; // Assign the auto-generated ID
              }
              batch.set(docRef, product);
            });

            await batch.commit();
            console.log(`Cargados productos ${i + 1} a ${Math.min(i + batchSize, products.length)}`);
          }

          console.log('✓ Todos los productos han sido cargados exitosamente');

          // Optionally upload categories
          console.log('\nCargando categorías...');
          const categoriesBatch = db.batch();
          let catIndex = 0;
          categories.forEach((cat) => {
            const catRef = db.collection('gamerhouse_categorias').doc();
            categoriesBatch.set(catRef, {
              name: cat,
              createdAt: new Date(),
              productCount: 0
            });
            catIndex++;
          });
          await categoriesBatch.commit();
          console.log(`✓ ${categories.size} categorías cargadas`);

          console.log('\n✓ Migración completada exitosamente');
          resolve();
        } catch (error) {
          console.error('Error durante la migración:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('Error leyendo CSV:', error);
        reject(error);
      });
  });
}

migrateProducts()
  .then(() => {
    console.log('Cerrando conexión...');
    admin.app().delete();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migración fallida:', error);
    process.exit(1);
  });
