// Script para limpiar imágenes con dominios inválidos en gamerhouse_products
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Faltan credenciales de Firebase Admin. Verifica tu .env.local');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey
  })
});

const db = admin.firestore();
const INVALID_HOSTS = ['gamerhouse.cl', 'www.gamerhouse.cl'];

const hasInvalidUrl = (value) => {
  if (typeof value !== 'string') return false;
  return INVALID_HOSTS.some(host => value.includes(host));
};

async function clearProductImages() {
  const snapshot = await db.collection('gamerhouse_products').get();
  let updates = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const deletePayload = {};
    let needsUpdate = false;

    if (hasInvalidUrl(data.imagen)) {
      deletePayload.imagen = admin.firestore.FieldValue.delete();
      needsUpdate = true;
    }

    if (Array.isArray(data.imagenes) && data.imagenes.some(hasInvalidUrl)) {
      deletePayload.imagenes = admin.firestore.FieldValue.delete();
      needsUpdate = true;
    }

    if (needsUpdate) {
      await docSnap.ref.update(deletePayload);
      updates += 1;
      console.log(`🧹 Limpiada imagen en producto ${docSnap.id}`);
    }
  }

  console.log(`✅ Proceso completado. Productos actualizados: ${updates}`);
}

clearProductImages().then(() => process.exit(0)).catch((error) => {
  console.error('❌ Error limpiando imágenes:', error);
  process.exit(1);
});
