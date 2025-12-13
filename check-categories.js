const mysql = require('mysql2/promise');

async function checkCategories() {
  const connection = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu',
  });

  try {
    console.log('📊 Analizando categorías...\n');
    
    // Obtener todas las categorías
    const [categories] = await connection.execute('SELECT * FROM categories ORDER BY name');
    
    console.log('🏷️ TODAS LAS CATEGORÍAS:');
    categories.forEach(cat => {
      console.log(`  ID: ${cat.id} | Nombre: "${cat.name}" | Descripción: "${cat.description || 'Sin descripción'}"`);
    });
    
    console.log('\n📈 CONTEO DE PRODUCTOS POR CATEGORÍA:');
    const [productCount] = await connection.execute(`
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
    
    productCount.forEach(cat => {
      const status = cat.product_count === 0 ? '❌ SIN PRODUCTOS' : `✅ ${cat.product_count} productos`;
      console.log(`  ${cat.name} (ID: ${cat.id}) - ${status}`);
    });
    
    console.log('\n🔍 CATEGORÍAS DUPLICADAS (por nombre):');
    const categoryNames = {};
    categories.forEach(cat => {
      const name = cat.name.toLowerCase().trim();
      if (!categoryNames[name]) {
        categoryNames[name] = [];
      }
      categoryNames[name].push(cat);
    });
    
    let foundDuplicates = false;
    Object.entries(categoryNames).forEach(([name, cats]) => {
      if (cats.length > 1) {
        foundDuplicates = true;
        console.log(`  "${name}" aparece ${cats.length} veces:`);
        cats.forEach(cat => {
          console.log(`    - ID: ${cat.id}, Nombre exacto: "${cat.name}"`);
        });
      }
    });
    
    if (!foundDuplicates) {
      console.log('  ✅ No se encontraron duplicados exactos');
    }
    
    console.log('\n🧹 CATEGORÍAS VACÍAS (sin productos):');
    const emptyCategories = productCount.filter(cat => cat.product_count === 0);
    if (emptyCategories.length > 0) {
      emptyCategories.forEach(cat => {
        console.log(`  - ${cat.name} (ID: ${cat.id})`);
      });
      console.log(`\n💡 Se encontraron ${emptyCategories.length} categorías sin productos`);
    } else {
      console.log('  ✅ Todas las categorías tienen productos asignados');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkCategories();