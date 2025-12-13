import { NextRequest, NextResponse } from "next/server"
import { readdir } from "fs/promises"
import { join } from "path"
import { getCurrentUser } from "@/lib/auth-simple"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Ruta a la carpeta de productos
    const productsDir = join(process.cwd(), 'public', 'uploads', 'products')
    
    try {
      const files = await readdir(productsDir)
      
      // Filtrar solo imágenes
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      const images = files
        .filter(file => imageExtensions.some(ext => file.toLowerCase().endsWith(ext)))
        .map(file => ({
          name: file,
          url: `/uploads/products/${file}`
        }))
        .sort((a, b) => a.name.localeCompare(b.name))

      return NextResponse.json({
        success: true,
        images,
        count: images.length
      })
    } catch (error) {
      console.error('Error reading directory:', error)
      return NextResponse.json(
        { error: "Error al leer carpeta de imágenes", images: [], count: 0 },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error listing images:', error)
    return NextResponse.json(
      { error: "Error al listar imágenes" },
      { status: 500 }
    )
  }
}
