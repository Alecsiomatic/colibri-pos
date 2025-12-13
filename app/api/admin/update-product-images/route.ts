import { NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/mysql-db"
import { getCurrentUser } from "@/lib/auth-simple"

export async function POST(request: NextRequest) {
  try {
    console.log('🖼️  [Update Images] Iniciando...')
    const user = await getCurrentUser(request)
    
    if (!user || !user.is_admin) {
      console.log('❌ No autorizado')
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    console.log('📊 Obteniendo productos...')
    // Obtener todos los productos
    const products: any = await executeQuery(
      'SELECT id, name, image_url FROM products ORDER BY name',
      []
    )

    console.log(`✅ Productos obtenidos: ${products.length}`)

    // Imágenes disponibles
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

    const normalizeForMatch = (str: string) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
    }

    let updated = 0
    let notFound = 0
    const results = []

    for (const product of products) {
      const productNameNorm = normalizeForMatch(product.name)
      
      let matchedImage = availableImages.find(img => {
        const imgNameNorm = normalizeForMatch(img.replace(/\.(jpg|jpeg|png)$/i, ''))
        return imgNameNorm === productNameNorm || 
               imgNameNorm.includes(productNameNorm) ||
               productNameNorm.includes(imgNameNorm)
      })

      if (matchedImage) {
        const newImageUrl = `/uploads/products/${matchedImage}`
        
        if (product.image_url !== newImageUrl) {
          await executeQuery(
            'UPDATE products SET image_url = ? WHERE id = ?',
            [newImageUrl, product.id]
          )
          results.push({
            id: product.id,
            name: product.name,
            status: 'updated',
            before: product.image_url || 'Sin imagen',
            after: newImageUrl
          })
          updated++
        } else {
          results.push({
            id: product.id,
            name: product.name,
            status: 'unchanged',
            image: newImageUrl
          })
        }
      } else {
        results.push({
          id: product.id,
          name: product.name,
          status: 'not_found'
        })
        notFound++
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: products.length,
        updated,
        unchanged: products.length - updated - notFound,
        notFound
      },
      results
    })

  } catch (error) {
    console.error('Error updating product images:', error)
    return NextResponse.json(
      { error: "Error al actualizar imágenes" },
      { status: 500 }
    )
  }
}
