import { executeQuery } from '@/lib/db'

async function loadMenu() {
  console.log('🚀 Iniciando carga del menú completo...')

  try {
    // 1. CATEGORÍA: HAMBURGUESAS
    console.log('\n🟡 Cargando Hamburguesas...')
    
    const hamburguesasResult = await executeQuery(
      `INSERT INTO categories (name, description) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
      ['Hamburguesas', 'Deliciosas hamburguesas con papas incluidas']
    )
    const hamburguesasId = (hamburguesasResult as any).insertId || 1

    // Productos - Clásicas
    await executeQuery(
      `INSERT INTO products (name, description, price, category_id, is_available, image_url) 
       VALUES 
       ('Galaxy Burger', 'Hamburguesa clásica. Incluye papas a la francesa', 120, ?, TRUE, '/uploads/products/galaxy-burger.jpg'),
       ('Orbit Burger', 'Hamburguesa clásica. Incluye papas a la francesa', 130, ?, TRUE, '/uploads/products/orbit-burger.jpg'),
       ('Orion Burger', 'Hamburguesa clásica. Incluye papas a la francesa', 135, ?, TRUE, '/uploads/products/orion-burger.jpg')`,
      [hamburguesasId, hamburguesasId, hamburguesasId]
    )

    // Productos - Especiales
    await executeQuery(
      `INSERT INTO products (name, description, price, category_id, is_available, image_url) 
       VALUES 
       ('Gravity Burger', 'Con camarones, piña y mango habanero. Incluye papas a la francesa', 155, ?, TRUE, '/uploads/products/gravity-burger.jpg'),
       ('Planet Burger', 'Con jalapeños empanizados. Incluye papas a la francesa', 150, ?, TRUE, '/uploads/products/planet-burger.jpg'),
       ('Moon Burger', 'Con huevo estrellado y maple. Incluye papas a la francesa', 145, ?, TRUE, '/uploads/products/moon-burger.jpg'),
       ('Supermassive Burger', 'Con aros de cebolla y BBQ. Incluye papas a la francesa', 135, ?, TRUE, '/uploads/products/supermassive-burger.jpg'),
       ('Nebula Burger', 'Con pollo empanizado. Incluye papas a la francesa', 135, ?, TRUE, '/uploads/products/nebula-burger.jpg'),
       ('Big Bang Burger', 'Con cerdo al pastor. Incluye papas a la francesa', 150, ?, TRUE, '/uploads/products/bigbang-burger.jpg')`,
      [hamburguesasId, hamburguesasId, hamburguesasId, hamburguesasId, hamburguesasId, hamburguesasId]
    )

    // Productos - Veganas
    await executeQuery(
      `INSERT INTO products (name, description, price, category_id, is_available, image_url) 
       VALUES ('Hamburguesa Vegana', 'Opción 100% vegana. Incluye papas a la francesa', 120, ?, TRUE, '/uploads/products/vegana-burger.jpg')`,
      [hamburguesasId]
    )

    console.log('✅ Hamburguesas cargadas (10 productos)')

    // 2. CATEGORÍA: BONELESS & WINGS
    console.log('\n🔴 Cargando Boneless & Wings...')
    
    const bonelessResult = await executeQuery(
      `INSERT INTO categories (name, description) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
      ['Boneless & Wings', 'Boneless y alitas con salsas deliciosas. Incluye bastones de zanahoria, apio y ranch']
    )
    const bonelessId = (bonelessResult as any).insertId || 2

    await executeQuery(
      `INSERT INTO products (name, description, price, category_id, is_available, image_url) 
       VALUES 
       ('Asteroid Boneless', '10 piezas de boneless con tu salsa favorita (Mango Habanero, BBQ, BBQ Hot, Búfalo, Lemon Pepper). Incluye bastones de zanahoria, apio y ranch', 150, ?, TRUE, '/uploads/products/asteroid-boneless.jpg'),
       ('Galactic Wings', '10 piezas de alitas con tu salsa favorita (Mango Habanero, BBQ, BBQ Hot, Búfalo, Lemon Pepper). Incluye bastones de zanahoria, apio y ranch', 160, ?, TRUE, '/uploads/products/galactic-wings.jpg')`,
      [bonelessId, bonelessId]
    )

    console.log('✅ Boneless & Wings cargados (2 productos)')

    // 3. CATEGORÍA: MENÚ INFANTIL
    console.log('\n🟢 Cargando Menú Infantil...')
    
    const infantilResult = await executeQuery(
      `INSERT INTO categories (name, description) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
      ['Menú Infantil', 'Para los pequeños astronautas. Incluye juguito (manzana, mango o durazno)']
    )
    const infantilId = (infantilResult as any).insertId || 3

    await executeQuery(
      `INSERT INTO products (name, description, price, category_id, is_available, image_url) 
       VALUES 
       ('Pyxis Burger', 'Carne de res, queso americano + juguito (manzana, mango o durazno)', 120, ?, TRUE, '/uploads/products/pyxis-burger.jpg'),
       ('Apollo Burger', 'Pollo empanizado, queso americano + juguito (manzana, mango o durazno)', 120, ?, TRUE, '/uploads/products/apollo-burger.jpg'),
       ('Meteor Nuggets', '8 piezas de nuggets + papas + juguito (manzana, mango o durazno)', 120, ?, TRUE, '/uploads/products/meteor-nuggets.jpg'),
       ('Polaris Bites', '100g mini boneless + papas + juguito (manzana, mango o durazno)', 120, ?, TRUE, '/uploads/products/polaris-bites.jpg')`,
      [infantilId, infantilId, infantilId, infantilId]
    )

    console.log('✅ Menú Infantil cargado (4 productos)')

    // 4. CATEGORÍA: ACOMPAÑAMIENTOS
    console.log('\n🟤 Cargando Acompañamientos...')
    
    const acompResult = await executeQuery(
      `INSERT INTO categories (name, description) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
      ['Acompañamientos', 'Complementa tu comida con nuestros deliciosos acompañamientos']
    )
    const acompId = (acompResult as any).insertId || 4

    await executeQuery(
      `INSERT INTO products (name, description, price, category_id, is_available, image_url) 
       VALUES 
       ('Papas a la Francesa', 'Lemon pepper, cajun o natural', 60, ?, TRUE, '/uploads/products/papas-francesa.jpg'),
       ('Sweet Potatoes', 'Papas dulces crujientes', 70, ?, TRUE, '/uploads/products/sweet-potatoes.jpg'),
       ('Aros de Cebolla', 'Crujientes aros de cebolla', 75, ?, TRUE, '/uploads/products/aros-cebolla.jpg'),
       ('Papas Crisscut', 'Papas en corte especial', 75, ?, TRUE, '/uploads/products/papas-crisscut.jpg'),
       ('Papas Gajo', 'Papas en gajos con especias', 75, ?, TRUE, '/uploads/products/papas-gajo.jpg'),
       ('Papas Nacho', 'Con queso gratinado y tocino', 90, ?, TRUE, '/uploads/products/papas-nacho.jpg')`,
      [acompId, acompId, acompId, acompId, acompId, acompId]
    )

    console.log('✅ Acompañamientos cargados (6 productos)')

    // 5. CATEGORÍA: POSTRES
    console.log('\n🟣 Cargando Postres...')
    
    const postresResult = await executeQuery(
      `INSERT INTO categories (name, description) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
      ['Postres', 'Deliciosos postres para cerrar con broche de oro']
    )
    const postresId = (postresResult as any).insertId || 5

    await executeQuery(
      `INSERT INTO products (name, description, price, category_id, is_available, image_url) 
       VALUES 
       ('Waffle con Helado', 'Waffle con helado, cajeta y nuez', 60, ?, TRUE, '/uploads/products/waffle.jpg'),
       ('Affogato', 'Helado con espresso', 70, ?, TRUE, '/uploads/products/affogato.jpg'),
       ('Pan de Elote', 'Con helado', 75, ?, TRUE, '/uploads/products/pan-elote.jpg'),
       ('Paletita', 'Paleta de hielo', 10, ?, TRUE, '/uploads/products/paletita.jpg')`,
      [postresId, postresId, postresId, postresId]
    )

    console.log('✅ Postres cargados (4 productos)')

    // 6. CATEGORÍA: BEBIDAS
    console.log('\n🔵 Cargando Bebidas...')
    
    const bebidasResult = await executeQuery(
      `INSERT INTO categories (name, description) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
      ['Bebidas', 'Refrescos, aguas y cafés para acompañar']
    )
    const bebidasId = (bebidasResult as any).insertId || 6

    await executeQuery(
      `INSERT INTO products (name, description, price, category_id, is_available, image_url) 
       VALUES 
       ('Refresco Coca-Cola', 'Variedad Coca-Cola', 35, ?, TRUE, '/uploads/products/coca-cola.jpg'),
       ('Agua Natural', 'Agua purificada', 10, ?, TRUE, '/uploads/products/agua-natural.jpg'),
       ('Agua Mineral', 'Agua mineral natural', 25, ?, TRUE, '/uploads/products/agua-mineral.jpg'),
       ('Agua Mineral con Sabor', 'Agua mineral con sabor', 30, ?, TRUE, '/uploads/products/agua-sabor.jpg'),
       ('Café Americano', 'Café americano recién hecho', 25, ?, TRUE, '/uploads/products/cafe-americano.jpg'),
       ('Capuchino', 'Capuchino cremoso', 45, ?, TRUE, '/uploads/products/capuchino.jpg'),
       ('Café Espresso', 'Espresso intenso', 30, ?, TRUE, '/uploads/products/espresso.jpg')`,
      [bebidasId, bebidasId, bebidasId, bebidasId, bebidasId, bebidasId, bebidasId]
    )

    console.log('✅ Bebidas cargadas (7 productos)')

    // RESUMEN
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ MENÚ COMPLETO CARGADO EXITOSAMENTE')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n📊 Resumen:')
    console.log('🟡 Hamburguesas: 10 productos (Clásicas, Especiales, Veganas)')
    console.log('🔴 Boneless & Wings: 2 productos')
    console.log('🟢 Menú Infantil: 4 productos')
    console.log('🟤 Acompañamientos: 6 productos')
    console.log('🟣 Postres: 4 productos')
    console.log('🔵 Bebidas: 7 productos')
    console.log('\n📦 Total: 33 productos en 6 categorías')
    console.log('\n💡 Notas:')
    console.log('   • Todas las hamburguesas incluyen papas a la francesa')
    console.log('   • Boneless y Wings incluyen bastones de zanahoria, apio y ranch')
    console.log('   • Menú infantil incluye juguito (manzana, mango o durazno)')
    console.log('   • Ingredientes extra tienen costo adicional')
    console.log('\n🖼️  Imágenes placeholder agregadas (actualizar luego con fotos reales)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('❌ Error cargando menú:', error)
    throw error
  }
}

loadMenu()
  .then(() => {
    console.log('✅ Script completado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
