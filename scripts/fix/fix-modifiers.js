const mysql = require('mysql2/promise')
require('dotenv').config({ path: '.env.local' })

async function fixModifiers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })

  try {
    // Ver TODOS los modificadores (incluso inactivos)
    const [allMods] = await connection.execute(
      'SELECT * FROM product_modifiers'
    )
    console.log('📊 TODOS los modificadores (incluso inactivos):')
    console.table(allMods)
    
    if (allMods.length === 0) {
      console.log('\n❌ No hay modificadores. Las opciones están huérfanas.')
      console.log('🔧 Opciones huérfanas: group_id=1, group_id=34')
    } else {
      console.log('\n🔧 Activando modificadores...')
      await connection.execute(
        'UPDATE product_modifiers SET is_active = 1'
      )
      console.log('✅ Modificadores activados')
    }
    
  } finally {
    await connection.end()
  }
}

fixModifiers().catch(console.error)
