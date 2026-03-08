const mysql = require('mysql2/promise')
require('dotenv').config({ path: '.env.local' })

async function checkModifiers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })

  try {
    console.log('✅ Conectado a la base de datos remota\n')
    
    // 1. Contar modificadores
    const [modCount] = await connection.execute(
      'SELECT COUNT(*) as total FROM product_modifiers WHERE is_active = 1'
    )
    console.log('📊 Total de modificadores activos:', modCount[0].total)
    
    // 2. Contar opciones
    const [optCount] = await connection.execute(
      'SELECT COUNT(*) as total FROM modifier_options WHERE is_active = 1'
    )
    console.log('📊 Total de opciones activas:', optCount[0].total)
    console.log('\n')
    
    // 3. Ver todos los modificadores
    const [modifiers] = await connection.execute(
      'SELECT * FROM product_modifiers WHERE is_active = 1 LIMIT 10'
    )
    console.log('🔧 Modificadores en la BD:')
    console.table(modifiers)
    
    // 4. Ver todas las opciones
    const [options] = await connection.execute(
      'SELECT * FROM modifier_options WHERE is_active = 1 LIMIT 10'
    )
    console.log('\n📋 Opciones de modificadores:')
    console.table(options)
    
    // 5. Productos con modificadores (JOIN)
    const [joined] = await connection.execute(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        m.id as mod_id,
        m.name as mod_name,
        mo.id as opt_id,
        mo.name as opt_name,
        mo.price_adjustment
      FROM products p
      INNER JOIN product_modifiers m ON m.product_id = p.id
      LEFT JOIN modifier_options mo ON mo.group_id = m.id
      WHERE p.is_available = 1 AND m.is_active = 1
      LIMIT 20
    `)
    console.log('\n🔗 Productos con modificadores (JOIN):')
    console.table(joined)
    
    // 6. Verificar si group_id coincide con modifier_id
    const [validation] = await connection.execute(`
      SELECT 
        mo.id as option_id,
        mo.name as option_name,
        mo.group_id,
        m.id as modifier_id,
        m.name as modifier_name,
        CASE WHEN mo.group_id = m.id THEN 'OK' ELSE 'ERROR' END as match_status
      FROM modifier_options mo
      LEFT JOIN product_modifiers m ON m.id = mo.group_id
      WHERE mo.is_active = 1
      LIMIT 10
    `)
    console.log('\n✅ Validación de relación group_id → modifier_id:')
    console.table(validation)
    
  } finally {
    await connection.end()
  }
}

checkModifiers().catch(console.error)
