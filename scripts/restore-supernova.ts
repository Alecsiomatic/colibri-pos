import { executeQuery } from '@/lib/db'

async function restoreSupernova() {
  console.log('🔄 Restaurando menú de Supernova Burgers...')

  // Insertar categorías
  await executeQuery(`INSERT INTO categories (name, description, is_active) VALUES 
    ('Hamburguesas', 'Deliciosas hamburguesas con papas incluidas', 1)`)
  await executeQuery(`INSERT INTO categories (name, description, is_active) VALUES 
    ('Boneless & Wings', 'Boneless y alitas con salsas deliciosas', 1)`)
  await executeQuery(`INSERT INTO categories (name, description, is_active) VALUES 
    ('Menú Infantil', 'Para los pequeños astronautas', 1)`)
  await executeQuery(`INSERT INTO categories (name, description, is_active) VALUES 
    ('Acompañamientos', 'Complementa tu comida', 1)`)
  await executeQuery(`INSERT INTO categories (name, description, is_active) VALUES 
    ('Postres', 'Deliciosos postres', 1)`)
  await executeQuery(`INSERT INTO categories (name, description, is_active) VALUES 
    ('Bebidas', 'Refrescos, aguas y cafés', 1)`)

  const cats = (await executeQuery('SELECT id, name FROM categories')) as Array<{ id: number; name: string }>
  const catMap: Record<string, number> = {}
  for (const c of cats) {
    catMap[c.name] = c.id
  }

  // Hamburguesas
  const hId = catMap['Hamburguesas']
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Galaxy Burger', 'Hamburguesa clásica. Incluye papas a la francesa', 120, ${hId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Orbit Burger', 'Hamburguesa clásica. Incluye papas a la francesa', 130, ${hId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Orion Burger', 'Hamburguesa clásica. Incluye papas a la francesa', 135, ${hId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Gravity Burger', 'Con camarones, piña y mango habanero. Incluye papas', 155, ${hId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Planet Burger', 'Con jalapeños empanizados. Incluye papas', 150, ${hId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Moon Burger', 'Con huevo estrellado y maple. Incluye papas', 145, ${hId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Supermassive Burger', 'Con aros de cebolla y BBQ. Incluye papas', 135, ${hId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Nebula Burger', 'Con pollo empanizado. Incluye papas', 135, ${hId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Big Bang Burger', 'Con cerdo al pastor. Incluye papas', 150, ${hId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Hamburguesa Vegana', 'Opción 100% vegana. Incluye papas', 120, ${hId}, 1)`)
  console.log('✅ Hamburguesas: 10 productos')

  // Boneless
  const bId = catMap['Boneless & Wings']
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Asteroid Boneless', '10 piezas con tu salsa favorita. Incluye zanahoria, apio y ranch', 150, ${bId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Galactic Wings', '10 alitas con tu salsa favorita. Incluye zanahoria, apio y ranch', 160, ${bId}, 1)`)
  console.log('✅ Boneless & Wings: 2 productos')

  // Menú Infantil
  const iId = catMap['Menú Infantil']
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Pyxis Burger', 'Carne de res, queso americano + juguito', 120, ${iId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Apollo Burger', 'Pollo empanizado, queso americano + juguito', 120, ${iId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Meteor Nuggets', '8 nuggets + papas + juguito', 120, ${iId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Polaris Bites', '100g mini boneless + papas + juguito', 120, ${iId}, 1)`)
  console.log('✅ Menú Infantil: 4 productos')

  // Acompañamientos
  const aId = catMap['Acompañamientos']
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Papas a la Francesa', 'Lemon pepper, cajun o natural', 60, ${aId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Sweet Potatoes', 'Papas dulces crujientes', 70, ${aId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Aros de Cebolla', 'Crujientes aros de cebolla', 75, ${aId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Papas Crisscut', 'Papas en corte especial', 75, ${aId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Papas Gajo', 'Papas en gajos con especias', 75, ${aId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Papas Nacho', 'Con queso gratinado y tocino', 90, ${aId}, 1)`)
  console.log('✅ Acompañamientos: 6 productos')

  // Postres
  const pId = catMap['Postres']
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Waffle con Helado', 'Waffle con helado, cajeta y nuez', 60, ${pId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Affogato', 'Helado con espresso', 70, ${pId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Pan de Elote', 'Con helado', 75, ${pId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Paletita', 'Paleta de hielo', 10, ${pId}, 1)`)
  console.log('✅ Postres: 4 productos')

  // Bebidas
  const beId = catMap['Bebidas']
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Refresco Coca-Cola', 'Variedad Coca-Cola', 35, ${beId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Agua Natural', 'Agua purificada', 10, ${beId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Agua Mineral', 'Agua mineral natural', 25, ${beId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Agua Mineral con Sabor', 'Agua mineral con sabor', 30, ${beId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Café Americano', 'Café americano recién hecho', 25, ${beId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Capuchino', 'Capuchino cremoso', 45, ${beId}, 1)`)
  await executeQuery(`INSERT INTO products (name, description, price, category_id, is_available) VALUES 
    ('Café Espresso', 'Espresso intenso', 30, ${beId}, 1)`)
  console.log('✅ Bebidas: 7 productos')

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ SUPERNOVA BURGERS RESTAURADO')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 6 Categorías, 33 Productos')
}

restoreSupernova()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
