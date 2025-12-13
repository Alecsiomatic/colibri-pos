const mysql = require('mysql2/promise')

async function checkModifiersStructure() {
  const connection = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u191251575_colibridemo',
    password: 'Colibri2024!',
    database: 'u191251575_colibridemo'
  })

  try {
    console.log('📊 Estructura de product_modifiers:')
    const [modifiersCols] = await connection.execute('DESCRIBE product_modifiers')
    console.table(modifiersCols)

    console.log('\n📊 Estructura de modifier_options:')
    const [optionsCols] = await connection.execute('DESCRIBE modifier_options')
    console.table(optionsCols)

    console.log('\n📋 Datos de ejemplo:')
    const [modifiers] = await connection.execute('SELECT * FROM product_modifiers LIMIT 3')
    console.log('product_modifiers:', modifiers)

    const [options] = await connection.execute('SELECT * FROM modifier_options LIMIT 5')
    console.log('modifier_options:', options)

  } finally {
    await connection.end()
  }
}

checkModifiersStructure().catch(console.error)
