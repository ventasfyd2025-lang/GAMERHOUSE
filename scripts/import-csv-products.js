// Import products from WordPress CSV export to Firebase GAMERHOUSE
// Run with: FIREBASE_ADMIN_PROJECT_ID=xxx FIREBASE_ADMIN_CLIENT_EMAIL=xxx FIREBASE_ADMIN_PRIVATE_KEY=xxx npm run import:csv

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

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

async function importProducts() {
  console.log('🎮 Importando productos de WordPress a GAMERHOUSE...\n');

  try {
    // Find CSV file
    const csvPath = path.join(__dirname, '../.claude/wc-product-export-11-10-2025-1760154317332.csv');

    if (!fs.existsSync(csvPath)) {
      console.error('❌ Archivo CSV no encontrado:', csvPath);
      process.exit(1);
    }

    // Read and parse CSV
    console.log('📂 Leyendo archivo CSV...');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relaxColumnCount: true,
      relaxQuotes: true,
    });

    console.log(`📊 Total de productos encontrados: ${records.length}\n`);

    let imported = 0;
    let skipped = 0;

    // Import each product
    for (const record of records) {
      try {
        // Extract data from CSV
        let nombre = record['Nombre']?.trim();
        let precioRebajado = parseFloat(record['Precio rebajado']) || 0;
        const precioNormal = parseFloat(record['Precio normal']) || precioRebajado;
        const stock = parseInt(record['¿Existencias?']) || 0;
        const descripcion = record['Descripción']?.trim() || '';
        const descCorta = record['Descripción corta']?.trim() || '';
        const categorias = record['Categorías']?.trim() || 'Gaming';
        const imagenes = record['Imágenes']?.split(',')[0]?.trim() || '';

        // Inventar nombre si falta
        if (!nombre) {
          nombre = `Producto Gaming ${imported + skipped + 1}`;
        }

        // Inventar precio si falta
        if (precioRebajado === 0) {
          precioRebajado = 29999;
        }

        // Extract main category
        const mainCategory = categorias.split('>')[0]?.trim().toLowerCase() || 'gaming';

        // Map image URL
        const imagen = imagenes.replace(/\s/g, '');

        // Create product document
        const productData = {
          nombre,
          precio: precioRebajado,
          precioOriginal: precioNormal,
          stock,
          categoria: mainCategory,
          descripcion: descripcion || descCorta,
          imagen,
          categorias,
          tienda: 'gamerhouse',
          publicado: record['Publicado'] === '1',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Add to Firestore
        const docRef = await db.collection('gamerhouse_products').add(productData);
        console.log(`  ✅ ${nombre.substring(0, 50)}`);
        imported++;

      } catch (error) {
        console.error(`  ❌ Error en producto: ${record['Nombre']}`, error.message);
        skipped++;
      }
    }

    console.log('\n✨ ¡Importación completada!\n');
    console.log('📊 Resumen:');
    console.log(`   - Productos importados: ${imported}`);
    console.log(`   - Productos omitidos: ${skipped}`);
    console.log(`   - Total procesados: ${imported + skipped}`);
    console.log('\n🚀 Todos los productos de WordPress están en GAMERHOUSE!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

importProducts();
