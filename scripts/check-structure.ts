import { executeQuery } from '@/lib/db'

async function checkStructure() {
  console.log('🔍 Verificando estructura de tablas...\n')

  try {
    // Ver columnas de products
    const productsColumns = await executeQuery('DESCRIBE products', [])
    console.log('📦 Tabla PRODUCTS:')
    console.log(productsColumns)

    // Ver columnas de categories
    const categoriesColumns = await executeQuery('DESCRIBE categories', [])
    console.log('\n📂 Tabla CATEGORIES:')
    console.log(categoriesColumns)

  } catch (error) {
    console.error('❌ Error:', error)
  }

  process.exit(0)
}

checkStructure()
