import { executeQuery } from '@/lib/db'

type ProductSeed = {
  name: string
  description: string
  price: number
  imageUrl: string | null
  isAvailable: boolean
  sortOrder?: number
}

type CategorySeed = {
  name: string
  description: string
  isActive: boolean
  sortOrder: number
  products: ProductSeed[]
}

const RESET_EXISTING_MENU = true

const menuData: CategorySeed[] = [
  {
    name: 'BITES',
    description: 'Manzanas y fresas cubiertas con chocolate y toppings.',
    isActive: false,
    sortOrder: 0,
    products: [
      {
        name: 'Manzana Cubierta de Chocolate con Nuez',
        description: 'Manzana cubierta de chocolate con nuez en trozos.',
        price: 145,
        imageUrl: 'https://res.cloudinary.com/drswibb0s/image/upload/v1763693183/restaurants/items/pwxsorcyszdodxnvsioo.jpg',
        isAvailable: false,
      },
      {
        name: 'Manzana Cubierta con Chocolate y Lotus Biscoff',
        description: 'Manzana cubierta con chocolate y galleta Lotus Biscoff pulverizada.',
        price: 145,
        imageUrl: 'https://res.cloudinary.com/drswibb0s/image/upload/v1763692822/restaurants/items/xa03caggsfmlq4iarraz.jpg',
        isAvailable: false,
      },
      {
        name: 'Fresas Cubiertas de Chocolate con Nuez',
        description: 'Charola de seis piezas de fresas cubiertas de chocolate con nuez en trozos.',
        price: 150,
        imageUrl: 'https://res.cloudinary.com/drswibb0s/image/upload/v1763693703/restaurants/items/lgzi5c6vjudjpquicd5k.jpg',
        isAvailable: false,
      },
    ],
  },
  {
    name: 'Ychilito Dulces Enchilados',
    description: 'Dulces enchilados con chamoy y chilito estilo Ychilito.',
    isActive: true,
    sortOrder: 1,
    products: [
      {
        name: 'WINIS Enchilados',
        description: '200 gramos de Winis enchilados Ychilito.',
        price: 125,
        imageUrl: 'https://res.cloudinary.com/drswibb0s/image/upload/v1764532452/restaurants/items/xypq56a3pzmvfkoxp9vp.png',
        isAvailable: true,
      },
      {
        name: 'Skittles Enchilados',
        description: '162 gramos de Skittles enchilados con chamoy y chilito en polvo de Ychilito.',
        price: 135,
        imageUrl: 'https://res.cloudinary.com/drswibb0s/image/upload/v1764531604/restaurants/items/lsn462tg2xne8p5awmdh.png',
        isAvailable: true,
      },
      {
        name: 'Xtremes Belts Ychilito',
        description: '171 gramos de Xtremes Belts enchilados con chamoy y chilito en polvo de Ychilito.',
        price: 145,
        imageUrl: 'https://res.cloudinary.com/drswibb0s/image/upload/v1764531704/restaurants/items/mggnodoiceowugey71gu.png',
        isAvailable: true,
      },
      {
        name: 'Salvavidas Ychilito',
        description: '150 gramos de Salvavidas enchilados con chamoy y chilito en polvo de Ychilito.',
        price: 150,
        imageUrl: 'https://res.cloudinary.com/drswibb0s/image/upload/v1764532125/restaurants/items/hehdyngyvu0fu3z3d1op.png',
        isAvailable: true,
      },
      {
        name: 'Sour Patch Ychilito',
        description: '168 gramos de Sour Patch enchilados con chamoy y chilito en polvo de Ychilito.',
        price: 145,
        imageUrl: 'https://res.cloudinary.com/drswibb0s/image/upload/v1764531819/restaurants/items/gnkzsdjsz3ekj2z7pwn1.png',
        isAvailable: true,
      },
      {
        name: 'Mix Golos. Gajos de Naranja, Frutitas y Manguitos Ychilito',
        description: '200 gramos de Golos, Gajos de Naranja, Frutitas y Manguitos enchilados con chamoy y chilito en polvo de Ychilito.',
        price: 120,
        imageUrl: 'https://res.cloudinary.com/drswibb0s/image/upload/v1764532341/restaurants/items/ni5intnjt9kjlytli9dk.png',
        isAvailable: true,
      },
      {
        name: 'Frutitas Ychilito',
        description: '200 gramos de Frutitas enchiladas con chamoy y chilito en polvo de Ychilito.',
        price: 105,
        imageUrl: 'https://res.cloudinary.com/drswibb0s/image/upload/v1764532009/restaurants/items/nxy5mbbvlgv6vrxefl9v.png',
        isAvailable: true,
      },
    ],
  },
  {
    name: 'SNACKERY',
    description: 'Snacks preparados con la mezcla especial de Provi.',
    isActive: true,
    sortOrder: 2,
    products: [
      {
        name: 'Provi',
        description: 'Papitas preparadas en un mix de Provi, repollo, cueritos, cacahuates y salsas.',
        price: 90,
        imageUrl: null,
        isAvailable: true,
      },
    ],
  },
  {
    name: 'CHEESECAKE CUPS (SOBRE EXISTENCIA)',
    description: 'Cheesecake cups disponibles según existencia diaria.',
    isActive: true,
    sortOrder: 3,
    products: [
      {
        name: 'Lotus Biscoff',
        description: 'Mix de fresas, capa de cheesecake dulce y untable Lotus Biscoff (Creamy).',
        price: 115,
        imageUrl: null,
        isAvailable: false,
      },
      {
        name: 'Galleta Oreo',
        description: 'Mix de fresas, capa de cheesecake, Nutella y galleta Oreo pulverizada.',
        price: 100,
        imageUrl: null,
        isAvailable: false,
      },
    ],
  },
  {
    name: 'FRESAS',
    description: 'Fresas con crema en versiones clásicas y especiales.',
    isActive: true,
    sortOrder: 4,
    products: [
      {
        name: 'Fresas Cheescake Tortuga',
        description: 'Mix de fresas, crema tradicional, Nutella, nuez y cheesecake de tortuga del Costco.',
        price: 100,
        imageUrl: null,
        isAvailable: true,
      },
      {
        name: 'Fresas Cheescake Frambuesa',
        description: 'Mix de fresas, crema tradicional, Nutella, nuez y cheesecake de frambuesa del Costco.',
        price: 100,
        imageUrl: null,
        isAvailable: true,
      },
      {
        name: 'De Lotus Biscoff',
        description: 'Mix de fresas, crema tradicional y preparado cremoso sabor Lotus Biscoff.',
        price: 145,
        imageUrl: 'https://res.cloudinary.com/drswibb0s/image/upload/v1763609116/restaurants/items/rlhvebuu9qtm4mgifkf5.jpg',
        isAvailable: true,
      },
      {
        name: 'Fresas Con Miel de Abelha',
        description: 'Mix de fresas y almendras con crema tradicional y preparado Miel de Abelha.',
        price: 145,
        imageUrl: 'https://res.cloudinary.com/drswibb0s/image/upload/v1763690680/restaurants/items/n6brhbfdaaorx0lqzuiq.jpg',
        isAvailable: true,
      },
      {
        name: 'De Gloria Untable Las Sevillanas',
        description: 'Mix de fresas, crema tradicional y preparado cremoso Gloria Untable con obleas.',
        price: 160,
        imageUrl: 'https://res.cloudinary.com/drswibb0s/image/upload/v1763608505/restaurants/items/f2wlfuiytvl1ytpyq4vp.jpg',
        isAvailable: true,
      },
      {
        name: 'Cocada de Coro (Coronado)',
        description: 'Mix de fresas, crema tradicional y preparado cremoso sabor Cocada de Coro.',
        price: 145,
        imageUrl: 'https://res.cloudinary.com/drswibb0s/image/upload/v1763609476/restaurants/items/lkxkibigdqhmwgdbqupq.jpg',
        isAvailable: true,
      },
      {
        name: 'Chocolate',
        description: 'Mix de fresas, crema tradicional, Nutella, Kinder Délice y Kit Kat.',
        price: 125,
        imageUrl: 'https://res.cloudinary.com/drswibb0s/image/upload/v1763608938/restaurants/items/gbdp3kvibrus4onzfsyf.jpg',
        isAvailable: true,
      },
      {
        name: 'Con Queso Crema Dulce (Philadelphia)',
        description: 'Mix de fresas, crema tradicional y preparado de queso crema dulce (Philadelphia).',
        price: 115,
        imageUrl: 'https://res.cloudinary.com/drswibb0s/image/upload/v1763691468/restaurants/items/eoe5c0ht0mun9hbmhuh9.jpg',
        isAvailable: true,
      },
      {
        name: 'Tradicional',
        description: 'Mix de fresas con la crema tradicional de la casa.',
        price: 90,
        imageUrl: 'https://res.cloudinary.com/drswibb0s/image/upload/v1763692287/restaurants/items/jnfbok0qfqjlu4gxrudt.jpg',
        isAvailable: true,
      },
      {
        name: 'Toques de Otoño (Por Temporada)',
        description: 'Mix de fresas con crema mezcla otoñal con canela, nuez moscada y clavo.',
        price: 80,
        imageUrl: null,
        isAvailable: false,
      },
      {
        name: 'Sour x Ychilito',
        description: 'Mix de fresas frescas con preparado de chamoy y chilito en polvo receta Ychilito.',
        price: 90,
        imageUrl: 'https://res.cloudinary.com/drswibb0s/image/upload/v1763596243/restaurants/items/b6nxez2saemhcgydeeny.jpg',
        isAvailable: true,
      },
    ],
  },
  {
    name: 'CREPAS',
    description: 'Crepas dulces con rellenos inspirados en los favoritos de la casa.',
    isActive: true,
    sortOrder: 5,
    products: [
      {
        name: 'Lucía',
        description: 'Crepa con fresas, nuez y untable de queso crema dulce (con Philadelphia).',
        price: 125,
        imageUrl: null,
        isAvailable: true,
      },
      {
        name: 'Isabel',
        description: 'Crepa con queso crema dulce, Nutella, fresas y plátano.',
        price: 125,
        imageUrl: null,
        isAvailable: true,
      },
      {
        name: 'Norma (Lotus)',
        description: 'Crepa con queso crema dulce, Lotus Biscoff, fresas y crema tradicional.',
        price: 145,
        imageUrl: null,
        isAvailable: true,
      },
      {
        name: 'Marita (Glorias)',
        description: 'Crepa con queso crema dulce, Gloria Las Sevillanas, fresas y obleas en trozos.',
        price: 145,
        imageUrl: null,
        isAvailable: true,
      },
    ],
  },
]

async function clearExistingMenu() {
  console.log('\n🔄 Limpiando menú previo...')
  await executeQuery('DELETE FROM products')
  await executeQuery('DELETE FROM categories')
}

async function ensureCategory(category: CategorySeed) {
  const existing = (await executeQuery('SELECT id FROM categories WHERE name = ? LIMIT 1', [category.name])) as Array<{ id: number }>

  if (existing && existing.length > 0) {
    const categoryId = existing[0].id
    await executeQuery(
      'UPDATE categories SET description = ?, is_active = ?, sort_order = ? WHERE id = ?',
      [category.description, category.isActive, category.sortOrder, categoryId],
    )
    return categoryId
  }

  const result = (await executeQuery(
    'INSERT INTO categories (name, description, is_active, sort_order) VALUES (?, ?, ?, ?)',
    [category.name, category.description, category.isActive, category.sortOrder],
  )) as { insertId: number }

  return result.insertId
}

async function ensureProduct(product: ProductSeed, categoryId: number, sortOrder: number) {
  const existing = (await executeQuery('SELECT id FROM products WHERE name = ? LIMIT 1', [product.name])) as Array<{ id: number }>

  if (existing && existing.length > 0) {
    await executeQuery(
      `UPDATE products
         SET description = ?, price = ?, image_url = ?, is_available = ?, category_id = ?
       WHERE id = ?`,
      [product.description, product.price, product.imageUrl, product.isAvailable, categoryId, existing[0].id],
    )
    return
  }

  await executeQuery(
    `INSERT INTO products (name, description, price, category_id, is_available, image_url)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [product.name, product.description, product.price, categoryId, product.isAvailable, product.imageUrl],
  )
}

async function loadMenu() {
  console.log('🚀 Iniciando carga del menú Liciosos...')

  try {
    if (RESET_EXISTING_MENU) {
      await clearExistingMenu()
    }

    let categoryCount = 0
    let productCount = 0

    for (const category of menuData) {
      console.log(`\n📂 Cargando categoría: ${category.name}`)

      const categoryId = await ensureCategory(category)

      for (const [index, product] of category.products.entries()) {
        await ensureProduct(product, categoryId, index)
      }

      categoryCount += 1
      productCount += category.products.length
      console.log(`✅ ${category.name}: ${category.products.length} productos sincronizados`)
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ MENÚ LICIOSOS CARGADO EXITOSAMENTE')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`\n📊 Categorías: ${categoryCount}`)
    console.log(`📦 Productos: ${productCount}`)
  } catch (error) {
    console.error('❌ Error cargando menú:', error)
    throw error
  }
}

loadMenu()
  .then(() => {
    console.log('\n✅ Script completado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  })
