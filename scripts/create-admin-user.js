// Script para crear usuario admin en Firebase
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Faltan variables de entorno:');
    console.error('   FIREBASE_ADMIN_PROJECT_ID:', projectId ? '✅' : '❌');
    console.error('   FIREBASE_ADMIN_CLIENT_EMAIL:', clientEmail ? '✅' : '❌');
    console.error('   FIREBASE_ADMIN_PRIVATE_KEY:', privateKey ? '✅' : '❌');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    })
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser() {
  try {
    const email = 'ventas.fyd2025@gmail.com';
    const password = '80426674011';
    const firstName = 'Administrador';
    const lastName = 'GAMERHOUSE';

    console.log('🔍 Verificando si el usuario ya existe...');

    let userRecord;
    try {
      // Intentar obtener el usuario existente
      userRecord = await auth.getUserByEmail(email);
      console.log(`✅ Usuario ya existe: ${userRecord.email}`);
      console.log(`   UID: ${userRecord.uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`📝 Creando nuevo usuario: ${email}`);
        userRecord = await auth.createUser({
          email,
          password,
          displayName: `${firstName} ${lastName}`,
          emailVerified: false,
        });
        console.log(`✅ Usuario creado exitosamente`);
        console.log(`   UID: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }

    // Asignar custom claims
    console.log('\n🔐 Asignando claims de administrador...');
    const currentClaims = userRecord.customClaims || {};
    await auth.setCustomUserClaims(userRecord.uid, {
      ...currentClaims,
      isAdmin: true,
      admin: true
    });
    console.log('✅ Claims asignados correctamente');

    // Crear o actualizar documento en Firestore
    console.log('\n📋 Configurando documento en Firestore...');
    const userDocRef = db.collection('users').doc(userRecord.uid);

    await userDocRef.set({
      uid: userRecord.uid,
      email,
      firstName,
      lastName,
      role: 'admin',
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      blocked: false,
    }, { merge: true });

    console.log('✅ Documento de usuario creado/actualizado en Firestore');

    // Mostrar resumen
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ¡ADMIN CREADO EXITOSAMENTE!');
    console.log('='.repeat(60));
    console.log('\n📧 Credenciales de acceso:');
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: ${password}`);
    console.log(`\n🔗 Login: http://localhost:3001/login`);
    console.log(`🛠️  Admin Dashboard: http://localhost:3001/admin`);
    console.log('\n⚠️  Importante:');
    console.log('   • El usuario debe cerrar sesión y volver a iniciar');
    console.log('   • Los claims pueden tomar unos segundos en propagarse');
    console.log('   • Si aún no aparece el acceso a admin, recarga la página');
    console.log('\n' + '='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createAdminUser();
