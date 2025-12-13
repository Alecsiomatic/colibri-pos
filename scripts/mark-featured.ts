import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu',
};

async function markFeaturedProducts() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('⭐ Marcando productos destacados...\n');

    // Marcar las primeras 6 hamburguesas como destacadas
    const featuredProducts = [
      'Galaxy Burger',
      'Orbit Burger',
      'Gravity Burger',
      'Planet Burger',
      'Supermassive Burger',
      'Nebula Burger'
    ];

    for (const productName of featuredProducts) {
      await connection.execute(
        'UPDATE products SET is_featured = 1 WHERE name = ?',
        [productName]
      );
      console.log(`✅ ${productName} marcado como destacado`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ ${featuredProducts.length} productos destacados`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

markFeaturedProducts()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
