const mysql = require('mysql2/promise');

async function cleanCategories() {
  const connection = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu',
  });

  try {
    console.log('🧹 Iniciando limpieza de categorías...\n');
    
    // 1. Identificar categorías duplicadas con productos
    const [duplicates] = await connection.execute(`
      SELECT 
        c1.id as keep_id,
        c1.name,
        c1.description as keep_desc,
        COUNT(p1.id) as keep_products,
        c2.id as remove_id,
        c2.description as remove_desc,
        COUNT(p2.id) as remove_products
      FROM categories c1
      JOIN categories c2 ON LOWER(c1.name) = LOWER(c2.name) AND c1.id < c2.id
      LEFT JOIN products p1 ON c1.id = p1.category_id
      LEFT JOIN products p2 ON c2.id = p2.category_id
      GROUP BY c1.id, c2.id
      ORDER BY c1.name
    `);
    
    for (const dup of duplicates) {
      console.log(`🔄 DUPLICADO ENCONTRADO: "${dup.name}"`);
      console.log(`  Mantener: ID ${dup.keep_id} (${dup.keep_products} productos) - "${dup.keep_desc}"`);
      console.log(`  Eliminar: ID ${dup.remove_id} (${dup.remove_products} productos) - "${dup.remove_desc}"`);
      
      // Si la categoría a eliminar tiene productos, moverlos a la que se mantiene
      if (dup.remove_products > 0) {
        console.log(`  📦 Moviendo ${dup.remove_products} productos de ID ${dup.remove_id} a ID ${dup.keep_id}...`);
        await connection.execute(
          'UPDATE products SET category_id = ? WHERE category_id = ?',
          [dup.keep_id, dup.remove_id]
        );
      }
      
      // Eliminar la categoría duplicada
      console.log(`  🗑️ Eliminando categoría duplicada ID ${dup.remove_id}...`);
      await connection.execute('DELETE FROM categories WHERE id = ?', [dup.remove_id]);
      console.log(`  ✅ Categoría "${dup.name}" limpiada\n`);
    }
    
    // 2. Eliminar categorías vacías (sin productos)
    console.log('🗑️ ELIMINANDO CATEGORÍAS VACÍAS:');
    const [emptyCategories] = await connection.execute(`
      SELECT c.id, c.name, c.description
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name, c.description
      HAVING COUNT(p.id) = 0
    `);
    
    for (const empty of emptyCategories) {
      console.log(`  🗑️ Eliminando categoría vacía: "${empty.name}" (ID: ${empty.id})`);
      await connection.execute('DELETE FROM categories WHERE id = ?', [empty.id]);
    }
    
    if (emptyCategories.length === 0) {
      console.log('  ✅ No hay categorías vacías para eliminar');
    } else {
      console.log(`  ✅ Eliminadas ${emptyCategories.length} categorías vacías\n`);
    }
    
    // 3. Mostrar resultado final
    console.log('📊 ESTADO FINAL DE CATEGORÍAS:');
    const [finalCategories] = await connection.execute(`
      SELECT 
        c.id,
        c.name,
        c.description,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name, c.description
      ORDER BY product_count DESC, c.name
    `);
    
    finalCategories.forEach(cat => {
      console.log(`  ✅ ${cat.name} (ID: ${cat.id}) - ${cat.product_count} productos`);
    });
    
    console.log(`\n🎉 ¡Limpieza completada! Ahora tienes ${finalCategories.length} categorías limpias.`);
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
  } finally {
    await connection.end();
  }
}

cleanCategories();