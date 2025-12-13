// Script para inicializar la base de datos MySQL
import { readFileSync } from 'fs'
import { join } from 'path'
import { executeQuery, getConnection } from '../lib/mysql-db'

async function initializeDatabase() {
  console.log('🚀 Iniciando configuración de base de datos MySQL...')
  
  try {
    // Leer el archivo SQL de inicialización
    const sqlPath = join(process.cwd(), 'scripts', 'init-mysql.sql')
    const sqlContent = readFileSync(sqlPath, 'utf8')
    
    // Dividir las consultas por punto y coma
    const queries = sqlContent
      .split(';')
      .map(query => query.trim())
      .filter(query => query.length > 0 && !query.startsWith('--'))
    
    console.log(`📝 Ejecutando ${queries.length} consultas...`)
    
    // Ejecutar cada consulta
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      if (query.trim()) {
        try {
          await executeQuery(query)
          console.log(`✅ Consulta ${i + 1}/${queries.length} ejecutada correctamente`)
        } catch (error: any) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_ENTRY') {
            console.log(`⚠️ Consulta ${i + 1}: ${error.message} (ignorado)`)
          } else {
            console.error(`❌ Error en consulta ${i + 1}:`, error.message)
            throw error
          }
        }
      }
    }
    
    // Verificar que las tablas se crearon correctamente
    const connection = await getConnection()
    try {
      const [tables] = await connection.execute('SHOW TABLES')
      console.log('📊 Tablas creadas:')
      ;(tables as any[]).forEach((table, index) => {
        const tableName = Object.values(table)[0]
        console.log(`  ${index + 1}. ${tableName}`)
      })
    } finally {
      connection.release()
    }
    
    console.log('🎉 Base de datos inicializada correctamente!')
    
  } catch (error) {
    console.error('💥 Error al inicializar la base de datos:', error)
    process.exit(1)
  }
}

// Función para verificar la conexión
async function testConnection() {
  try {
    console.log('🔌 Probando conexión a MySQL...')
    const connection = await getConnection()
    await connection.execute('SELECT 1')
    connection.release()
    console.log('✅ Conexión exitosa!')
    return true
  } catch (error) {
    console.error('❌ Error de conexión:', error)
    return false
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  (async () => {
    const isConnected = await testConnection()
    if (isConnected) {
      await initializeDatabase()
    }
    process.exit(0)
  })()
}

export { initializeDatabase, testConnection }