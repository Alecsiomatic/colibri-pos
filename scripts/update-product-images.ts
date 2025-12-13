import mysql from 'mysql2/promise'

async function updateProductImages() {
  const connection = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Manu1234',
    database: 'u191251575_manu'
  })

  try {
    console.log('\n🖼️  ACTUALIZANDO IMÁGENES DE PRODUCTOS\n')
    console.log('─'.repeat(80))

    // Obtener todos los productos
    const [products] = await connection.execute<any>(
      'SELECT id, name, image_url FROM products ORDER BY name'
    )

    console.log(`\n📦 Total de productos en BD: ${products.length}\n`)

    // Imágenes disponibles en la carpeta (normalizadas)
    const availableImages = [
      'Affogato.jpg',
      'agua mineral con sabor .jpg',
      'agua mineral.jpg',
      'Agua Natrual .jpg',
      'Apollo Burguer.jpg',
      'Aros de cebolla.jpg',
      'Asteroid Boneless.jpg',
      'Big Bang Burguer.jpeg',
      'Cafe Americano.jpg',
      'cafe espresso.jpg',
      'Capuchino.jpg',
      'Galactic Wings.jpg',
      'Galaxy Burguer.jpg',
      'Gravity Burguer.jpeg',
      'Meteor Nuggets.jpg',
      'Moon Burger.jpg',
      'nebula burguer.jpg',
      'Orbit Burguer.jpeg',
      'Orion Burguer.jpeg',
      'pan de elote.jpg',
      'Papas a la Francesa.jpeg',
      'papas crisscut.jpg',
      'paps gajo.jpg',
      'Paspas Nacho.jpg',
      'Planet Burguer.jpeg',
      'Polaris Bites.jpg',
      'Pyxis Burguer.jpg',
      'Refrescos Coca Cola.jpeg',
      'Supermassive Burger.jpeg',
      'sweet potatoes.jpg',
      'Waffle.jpg'
    ]

    // Normalizar nombres para matching
    const normalizeForMatch = (str: string) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/[^a-z0-9\s]/g, '') // Quitar caracteres especiales excepto espacios
        .trim()
    }

    let updated = 0
    let notFound = 0

    for (const product of products) {
      const productNameNorm = normalizeForMatch(product.name)
      
      // Buscar coincidencia en imágenes disponibles
      let matchedImage = availableImages.find(img => {
        const imgNameNorm = normalizeForMatch(img.replace(/\.(jpg|jpeg|png)$/i, ''))
        return imgNameNorm === productNameNorm || 
               imgNameNorm.includes(productNameNorm) ||
               productNameNorm.includes(imgNameNorm)
      })

      if (matchedImage) {
        const newImageUrl = `/uploads/products/${matchedImage}`
        
        // Actualizar solo si cambió
        if (product.image_url !== newImageUrl) {
          await connection.execute(
            'UPDATE products SET image_url = ? WHERE id = ?',
            [newImageUrl, product.id]
          )
          console.log(`✅ [${product.id}] ${product.name}`)
          console.log(`   Antes: ${product.image_url || 'Sin imagen'}`)
          console.log(`   Ahora: ${newImageUrl}\n`)
          updated++
        } else {
          console.log(`⏭️  [${product.id}] ${product.name} - Ya tiene la imagen correcta\n`)
        }
      } else {
        console.log(`❌ [${product.id}] ${product.name} - No se encontró imagen\n`)
        notFound++
      }
    }

    console.log('─'.repeat(80))
    console.log(`\n📊 RESUMEN:`)
    console.log(`   ✅ Actualizados: ${updated}`)
    console.log(`   ⏭️  Sin cambios: ${products.length - updated - notFound}`)
    console.log(`   ❌ Sin imagen: ${notFound}`)
    console.log(`\n💡 Si hay productos sin imagen, verifica que el nombre coincida con algún archivo.\n`)

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await connection.end()
  }
}

updateProductImages()
