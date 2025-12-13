const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu'
  });
  
  console.log('📝 Agregando columna icon a la tabla categories...\n');
  
  try {
    // Agregar columna icon
    await conn.execute(`
      ALTER TABLE categories 
      ADD COLUMN icon VARCHAR(50) NULL AFTER name
    `);
    console.log('✅ Columna icon agregada exitosamente\n');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  La columna icon ya existe\n');
    } else {
      throw error;
    }
  }
  
  console.log('📝 Actualizando iconos para cada categoría...\n');
  
  // Mapeo de categorías a iconos de lucide-react
  const categoryIcons = {
    'Postres': 'cake',
    'Hamburguesas': 'beef',
    'Boneless & Wings': 'drumstick',
    'Menú Infantil': 'baby',
    'Acompañamientos': 'utensils-crossed',
    'Bebidas': 'coffee'
  };
  
  // Actualizar cada categoría
  for (const [categoryName, iconName] of Object.entries(categoryIcons)) {
    try {
      await conn.execute(
        'UPDATE categories SET icon = ? WHERE name = ?',
        [iconName, categoryName]
      );
      console.log(`✅ ${categoryName} -> ${iconName}`);
    } catch (error) {
      console.error(`❌ Error actualizando ${categoryName}:`, error.message);
    }
  }
  
  console.log('\n📋 Categorías actualizadas:\n');
  const [categories] = await conn.execute('SELECT id, name, icon FROM categories');
  console.table(categories);
  
  await conn.end();
  console.log('\n✨ Proceso completado');
})();
