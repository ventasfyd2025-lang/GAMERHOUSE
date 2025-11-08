const admin = require('firebase-admin');
const fs = require('fs');

const envFile = '.env.local.json';
const serviceAccount = JSON.parse(fs.readFileSync(envFile, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

const hunterCardCategories = [
  {
    name: 'Pokémon TCG',
    subcategories: [
      'Booster Boxes',
      'Booster Packs',
      'Elite Trainer Boxes',
      'Collection Boxes',
      'Singles',
      'Bundles Especiales',
      'Productos en Preventa'
    ]
  },
  {
    name: 'One Piece TCG',
    subcategories: [
      'Booster Boxes',
      'Starter Decks',
      'Double Pack Sets',
      'Singles',
      'Don!! Cards Especiales'
    ]
  },
  {
    name: 'Star Wars Unlimited',
    subcategories: [
      'Spotlight Decks',
      'Jump to Lightspeed',
      'Singles'
    ]
  },
  {
    name: 'Yu-Gi-Oh!',
    subcategories: [
      'Singles - Español',
      'Singles - Inglés',
      'Cartas Especiales'
    ]
  },
  {
    name: 'Dragon Ball',
    subcategories: [
      'Singles SCR',
      'Energy Markers',
      'Booster Boxes'
    ]
  },
  {
    name: 'Digimon',
    subcategories: [
      'Starter Decks',
      'Singles',
      'Booster Boxes'
    ]
  },
  {
    name: 'Magic The Gathering',
    subcategories: [
      'Singles',
      'Cartas Foil Especiales',
      'Booster Boxes'
    ]
  },
  {
    name: 'Mitos y Leyendas',
    subcategories: [
      'Singles Primera Edición',
      'Cartas Legendarias',
      'Cartas Secretas'
    ]
  },
  {
    name: 'Accesorios',
    subcategories: [
      'Protectores BCW',
      'Sleeves',
      'Deck Boxes',
      'Playmats',
      'Binders',
      'Storage Solutions'
    ]
  }
];

async function uploadCategories() {
  try {
    console.log('📝 Iniciando carga de categorías HunterCard TCG...\n');

    // First, delete all existing categories from the collection
    console.log('🗑️ Eliminando categorías existentes...');
    const snapshot = await db.collection('gamerhouse_categorias').get();
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('✓ Categorías existentes eliminadas\n');

    // Upload new categories with subcategories
    let totalDocs = 0;

    for (const category of hunterCardCategories) {
      console.log(`📌 Procesando: ${category.name}`);

      // Add main category
      const categoryId = category.name.toLowerCase().replace(/\s+/g, '-');
      await db.collection('gamerhouse_categorias').doc(categoryId).set({
        name: category.name,
        active: true,
        createdAt: new Date(),
        productCount: 0
      });
      console.log(`  ✓ Categoría: ${category.name}`);
      totalDocs++;

      // Add subcategories with "Category > Subcategory" naming
      for (const subcategory of category.subcategories) {
        const subId = `${categoryId}-${subcategory.toLowerCase().replace(/\s+/g, '-')}`;
        await db.collection('gamerhouse_categorias').doc(subId).set({
          name: `${category.name} > ${subcategory}`,
          active: true,
          createdAt: new Date(),
          parentCategory: category.name
        });
        console.log(`    ✓ Subcategoría: ${subcategory}`);
        totalDocs++;
      }
      console.log();
    }

    console.log(`\n✅ Carga completada exitosamente!`);
    console.log(`📊 Total de documentos creados: ${totalDocs}`);
    console.log(`   - Categorías principales: ${hunterCardCategories.length}`);
    console.log(`   - Subcategorías: ${totalDocs - hunterCardCategories.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

uploadCategories();
