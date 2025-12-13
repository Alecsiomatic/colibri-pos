import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { getCurrentUser } from '@/lib/auth-simple'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser(request)
    if (!user || !user.is_admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'general'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se proporcionó ningún archivo' }, { status: 400 })
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF, WEBP)' 
      }, { status: 400 })
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'El archivo es demasiado grande. Máximo 5MB' 
      }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Crear nombre único para el archivo
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}-${originalName}`

    // Crear directorio si no existe
    const uploadDir = join(process.cwd(), 'public', 'uploads', folder)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Guardar archivo
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // Devolver URL pública
    const publicUrl = `/uploads/${folder}/${filename}`

    console.log(`Archivo subido: ${publicUrl}`)

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      filename: filename
    })

  } catch (error: any) {
    console.error('Error al subir archivo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al subir archivo' },
      { status: 500 }
    )
  }
}
