import mysql from 'mysql2/promise'

const db = mysql.createPool({
  host: 'srv440.hstgr.io',
  port: 3306,
  user: 'u574253054_demo',
  password: 'Smartway123*',
  database: 'u574253054_demo',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

async function seedData() {
  try {
    console.log('🌱 Iniciando seed de datos...')

    // Crear categorías
    const categories = [
      { name: 'Hamburguesas', description: 'Deliciosas hamburguesas galácticas' },
      { name: 'Alitas', description: 'Alitas picantes y sabrosas' },
      { name: 'Bebidas', description: 'Bebidas refrescantes del cosmos' },
      { name: 'Postres', description: 'Dulces de otros mundos' }
    ]

    console.log('📁 Creando categorías...')
    for (const category of categories) {
      await db.execute(
        'INSERT IGNORE INTO categories (name, description, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        [category.name, category.description]
      )
    }

    // Obtener IDs de categorías
    const [categoriesResult] = await db.execute('SELECT * FROM categories') as any[]
    const categoryMap = new Map()
    categoriesResult.forEach((cat: any) => {
      categoryMap.set(cat.name, cat.id)
    })

    // Crear productos
    const products = [
      {
        name: 'Supernova Burger',
        description: 'Hamburguesa explosiva con carne de res, queso cheddar, lechuga, tomate y salsa especial',
        price: 15.99,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
        category_id: categoryMap.get('Hamburguesas'),
        stock: 50,
        available: true
      },
      {
        name: 'Galaxy Wings',
        description: 'Alitas picantes con salsa BBQ cósmica y especias intergalácticas',
        price: 12.99,
        image_url: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=500',
        category_id: categoryMap.get('Alitas'),
        stock: 30,
        available: true
      },
      {
        name: 'Nebula Cheese Burger',
        description: 'Hamburguesa doble con queso derretido, cebolla caramelizada y bacon crujiente',
        price: 18.99,
        image_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=500',
        category_id: categoryMap.get('Hamburguesas'),
        stock: 45,
        available: true
      },
      {
        name: 'Cosmic Cola',
        description: 'Refresco de cola con burbujas espaciales y sabor único',
        price: 4.99,
        image_url: 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=500',
        category_id: categoryMap.get('Bebidas'),
        stock: 100,
        available: true
      },
      {
        name: 'Stellar Hot Wings',
        description: 'Alitas extra picantes con salsa de habanero y especias secretas',
        price: 14.99,
        image_url: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=500',
        category_id: categoryMap.get('Alitas'),
        stock: 25,
        available: true
      },
      {
        name: 'Milky Way Shake',
        description: 'Malteada cremosa de vainilla con topping de galaxia dulce',
        price: 7.99,
        image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500',
        category_id: categoryMap.get('Postres'),
        stock: 20,
        available: true
      }
    ]

    console.log('🍔 Creando productos...')
    for (const product of products) {
      const [existing] = await db.execute(
        'SELECT id FROM products WHERE name = ?',
        [product.name]
      ) as any[]

      if (existing.length === 0) {
        await db.execute(
          `INSERT INTO products 
           (name, description, price, image_url, category_id, stock, available, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            product.name,
            product.description,
            product.price,
            product.image_url,
            product.category_id,
            product.stock,
            product.available
          ]
        )
        console.log(`✅ Producto creado: ${product.name}`)
      } else {
        console.log(`⏭️ Producto ya existe: ${product.name}`)
      }
    }

    console.log('🎉 Seed completado exitosamente!')
    console.log(`📊 Categorías: ${categories.length}`)
    console.log(`🍕 Productos: ${products.length}`)

  } catch (error) {
    console.error('❌ Error durante el seed:', error)
  } finally {
    await db.end()
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  seedData()
}

export default seedData