const { executeQuery } = require('./lib/mysql-db.ts')

async function addDisplayOrder() {
  try {
    console.log('Agregando columna display_order a modifier_groups...')
    
    // Agregar columna display_order
    await executeQuery(`
      ALTER TABLE modifier_groups 
      ADD COLUMN display_order INT DEFAULT 0 AFTER is_required
    `)
    
    console.log('✅ Columna display_order agregada exitosamente')
    
    // Verificar estructura
    const structure = await executeQuery('DESCRIBE modifier_groups')
    console.log('\n📋 Estructura actualizada:')
    console.table(structure)
    
  } catch (error) {
    if (error.errno === 1060) {
      console.log('⚠️  La columna display_order ya existe')
    } else {
      console.error('❌ Error:', error.message)
    }
  }
}

addDisplayOrder()
