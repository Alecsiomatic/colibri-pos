import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu',
};

async function updateAdminEmail() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('🔍 Buscando usuarios admin...\n');

    const [admins]: any = await connection.execute(
      'SELECT id, email, username, is_admin FROM users WHERE is_admin = 1'
    );

    console.log(`✅ Encontrados ${admins.length} admins:\n`);
    admins.forEach((admin: any) => {
      console.log(`  ID: ${admin.id} | Email: ${admin.email} | Usuario: ${admin.username}`);
    });

    if (admins.length > 0) {
      console.log('\n🔄 Actualizando email del primer admin...');
      
      await connection.execute(
        'UPDATE users SET email = ? WHERE id = ?',
        ['admin@kalabasbooom.com', admins[0].id]
      );
      
      console.log('✅ Email actualizado\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ CREDENCIALES DE ACCESO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📧 Email:    admin@kalabasbooom.com');
    console.log('🔑 Password: admin123\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

updateAdminEmail()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
