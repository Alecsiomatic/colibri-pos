require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')

async function checkModifierGroups() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })

  try {
    console.log('🔍 Verificando sistema de modifier_groups...\n')

    // Contar grupos de modificadores activos
    const [groups] = await connection.execute(
      'SELECT COUNT(*) as count FROM modifier_groups WHERE is_active = 1'
    )
    console.log(`✅ Grupos de modificadores activos: ${groups[0].count}`)

    // Mostrar algunos ejemplos
    if (groups[0].count > 0) {
      const [exampleGroups] = await connection.execute(
        'SELECT * FROM modifier_groups WHERE is_active = 1 LIMIT 5'
      )
      console.log('\n📋 Ejemplos de grupos:')
      exampleGroups.forEach(g => {
        console.log(`   - ID ${g.id}: ${g.name} (min: ${g.min_selections}, max: ${g.max_selections})`)
      })
    }

    // Contar relaciones producto-grupo
    const [relations] = await connection.execute(
      'SELECT COUNT(*) as count FROM product_modifier_groups'
    )
    console.log(`\n✅ Relaciones producto-grupo: ${relations[0].count}`)

    // Mostrar algunos ejemplos
    if (relations[0].count > 0) {
      const [exampleRelations] = await connection.execute(`
        SELECT pmg.product_id, p.name as product_name, mg.name as modifier_name
        FROM product_modifier_groups pmg
        JOIN products p ON p.id = pmg.product_id
        JOIN modifier_groups mg ON mg.id = pmg.modifier_group_id
        LIMIT 5
      `)
      console.log('\n📋 Ejemplos de relaciones:')
      exampleRelations.forEach(r => {
        console.log(`   - Producto "${r.product_name}" tiene modificador "${r.modifier_name}"`)
      })
    }

    // Contar opciones de modificadores
    const [options] = await connection.execute(
      'SELECT COUNT(*) as count FROM modifier_options WHERE is_active = 1'
    )
    console.log(`\n✅ Opciones de modificadores activas: ${options[0].count}`)

    // Verificar si las opciones están correctamente vinculadas a grupos
    if (options[0].count > 0) {
      const [linkedOptions] = await connection.execute(`
        SELECT mo.*, mg.name as group_name
        FROM modifier_options mo
        LEFT JOIN modifier_groups mg ON mg.id = mo.group_id
        WHERE mo.is_active = 1
        LIMIT 10
      `)
      console.log('\n📋 Ejemplos de opciones vinculadas:')
      linkedOptions.forEach(o => {
        const status = o.group_name ? '✅' : '❌'
        console.log(`   ${status} Opción "${o.name}" → Grupo "${o.group_name || 'NO EXISTE'}"`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await connection.end()
  }
}

checkModifierGroups()
