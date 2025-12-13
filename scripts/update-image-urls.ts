import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'srv440.hstgr.io',
  user: process.env.DB_USER || 'u191251575_manu',
  password: process.env.DB_PASSWORD || 'Cerounocero.com20182417',
  database: process.env.DB_NAME || 'u191251575_manu',
};

async function updateImageUrls() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('🖼️  Actualizando URLs de imágenes con nombres correctos...\n');

    // Mapeo de productos a nombres de archivo basados en las imágenes
    const imageMapping = [
      // Hamburguesas
      { name: 'Galaxy Burger', image: 'galaxy-burger.jpg' },
      { name: 'Orbit Burger', image: 'orbit-burger.jpg' },
      { name: 'Orion Burger', image: 'orion-burger.jpg' },
      { name: 'Gravity Burger', image: 'gravity-burger.jpg' },
      { name: 'Planet Burger', image: 'planet-burger.jpg' },
      { name: 'Moon Burger', image: 'moon-burger.jpg' },
      { name: 'Supermassive Burger', image: 'supermassive-burger.jpg' },
      { name: 'Nebula Burger', image: 'nebula-burger.jpg' },
      { name: 'Big Bang Burger', image: 'big-bang-burger.jpg' },
      
      // Menú Infantil
      { name: 'Pyxis Burger', image: 'pyxis-burger.jpg' },
      { name: 'Apollo Burger', image: 'apollo-burger.jpg' },
      { name: 'Meteor Nuggets', image: 'meteor-nuggets.jpg' },
      
      // Boneless & Wings
      { name: 'Galactic Wings', image: 'galactic-wings.jpg' },
      
      // Bebidas
      { name: 'Capuchino', image: 'capuchino.jpg' },
      { name: 'Café Americano', image: 'cafe-americano.jpg' },
      { name: 'Café Espresso', image: 'cafe-espresso.jpg' },
      { name: 'Agua Mineral con Sabor', image: 'agua-mineral-con-sabor.jpg' },
      { name: 'Agua Mineral', image: 'agua-mineral.jpg' },
      { name: 'Agua Natural', image: 'agua-natural.jpg' },
      { name: 'Refresco Coca-Cola', image: 'refrescos-coca-cola.jpg' },
      
      // Postres
      { name: 'Waffle con Helado', image: 'waffle.jpg' },
      { name: 'Affogato', image: 'affogato.jpg' },
      { name: 'Pan de Elote', image: 'pan-de-elote.jpg' },
    ];

    let updated = 0;

    for (const item of imageMapping) {
      const [result]: any = await connection.execute(
        `UPDATE products 
         SET image_url = ? 
         WHERE name = ?`,
        [`/uploads/products/${item.image}`, item.name]
      );

      if (result.affectedRows > 0) {
        console.log(`✅ ${item.name} → ${item.image}`);
        updated++;
      } else {
        console.log(`⚠️  ${item.name} no encontrado en DB`);
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ ${updated} imágenes actualizadas correctamente`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    console.log('📝 Nombres de archivo detectados:');
    console.log('🟡 Hamburguesas: galaxy-burger.jpg, orbit-burger.jpg, orion-burger.jpg, gravity-burger.jpg,');
    console.log('   planet-burger.jpg, moon-burger.jpg, supermassive-burger.jpg, nebula-burger.jpg, big-bang-burger.jpg');
    console.log('🟢 Menú Infantil: pyxis-burger.jpg, apollo-burger.jpg, meteor-nuggets.jpg');
    console.log('🔴 Wings: galactic-wings.jpg');
    console.log('🔵 Bebidas: capuchino.jpg, cafe-americano.jpg, cafe-espresso.jpg, agua-mineral-con-sabor.jpg,');
    console.log('   agua-mineral.jpg, agua-natural.jpg, refrescos-coca-cola.jpg');
    console.log('🟣 Postres: waffle.jpg, affogato.jpg, pan-de-elote.jpg');
    console.log('\n💡 Ahora solo necesitas colocar las imágenes reales en public/uploads/products/');

  } catch (error) {
    console.error('❌ Error actualizando imágenes:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

updateImageUrls()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falló:', error);
    process.exit(1);
  });
