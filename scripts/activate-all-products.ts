import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu',
};

async function activateAllProducts() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('🔄 Actualizando todos los productos...\n');

    // Actualizar todos los productos
    await connection.execute(`
      UPDATE products 
      SET 
        is_available = 1,
        stock = 50,
        updated_at = NOW()
    `);

    // Verificar cambios
    const [products]: any = await connection.execute(`
      SELECT id, name, is_available, stock 
      FROM products 
      ORDER BY id
    `);

    console.log('✅ Productos actualizados:\n');
    products.forEach((p: any) => {
      const status = p.is_available ? '🟢 Activo' : '🔴 Inactivo';
      console.log(`  ${status} | Stock: ${p.stock} | ${p.name}`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ ${products.length} productos actualizados`);
    console.log('   • Stock: 50 unidades');
    console.log('   • Estado: Activos (disponibles)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

activateAllProducts()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
