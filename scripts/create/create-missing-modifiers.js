const mysql = require('mysql2/promise')
require('dotenv').config({ path: '.env.local' })

async function createMissingModifiers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })

  try {
    console.log('🔧 Creando modificadores faltantes...\n')
    
    // Obtener el primer producto activo
    const [products] = await connection.execute(
      'SELECT id, name FROM products WHERE is_available = 1 LIMIT 1'
    )
    
    if (products.length === 0) {
      console.log('❌ No hay productos disponibles')
      return
    }
    
    const productId = products[0].id
    const productName = products[0].name
    
    console.log(`📦 Usando producto: ${productName} (ID: ${productId})`)
    
    // Crear modificador con ID 1 para la opción "grande"
    await connection.execute(`
      INSERT INTO product_modifiers (id, product_id, name, price_adjustment, modifier_type, is_active, display_order)
      VALUES (1, ?, 'Tamaño', 0, 'size', 1, 1)
      ON DUPLICATE KEY UPDATE is_active = 1, product_id = ?
    `, [productId, productId])
    
    console.log('✅ Modificador ID 1 (Tamaño) creado/actualizado')
    
    // Crear modificador con ID 34 para la opción "cebolla"
    await connection.execute(`
      INSERT INTO product_modifiers (id, product_id, name, price_adjustment, modifier_type, is_active, display_order)
      VALUES (34, ?, 'Extras', 0, 'extra', 1, 2)
      ON DUPLICATE KEY UPDATE is_active = 1, product_id = ?
    `, [productId, productId])
    
    console.log('✅ Modificador ID 34 (Extras) creado/actualizado')
    
    // Verificar
    const [check] = await connection.execute(`
      SELECT 
        m.id, m.name as mod_name, m.product_id,
        mo.id as opt_id, mo.name as opt_name
      FROM product_modifiers m
      LEFT JOIN modifier_options mo ON mo.group_id = m.id
      WHERE m.id IN (1, 34)
    `)
    
    console.log('\n📊 Verificación:')
    console.table(check)
    
  } finally {
    await connection.end()
  }
}

createMissingModifiers().catch(console.error)
