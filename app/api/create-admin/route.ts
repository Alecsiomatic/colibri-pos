import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

const db = mysql.createPool({
  host: 'srv440.hstgr.io',
  port: 3306,
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Creando usuario administrador...')

    // Verificar si ya existe un admin
    const [existingAdmin] = await db.execute(
      'SELECT * FROM users WHERE is_admin = 1 LIMIT 1'
    ) as any[]

    if (existingAdmin.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Ya existe un usuario admin',
        admin: {
          username: existingAdmin[0].username,
          email: existingAdmin[0].email
        }
      })
    }

    // Datos del admin
    const adminData = {
      username: 'admin',
      email: 'admin@supernova.com',
      password: 'admin123',  // Contraseña simple para testing
      full_name: 'Administrador Supernova',
      phone: '+1234567890',
      is_admin: true,
      is_driver: false,
      active: true
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(adminData.password, 10)

    // Verificar si el usuario ya existe con este username/email
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [adminData.username, adminData.email]
    ) as any[]

    if (existing.length > 0) {
      // Actualizar usuario existente para hacerlo admin
      await db.execute(
        'UPDATE users SET is_admin = 1, password = ?, active = 1 WHERE id = ?',
        [hashedPassword, existing[0].id]
      )
      
      return NextResponse.json({
        success: true,
        message: 'Usuario existente actualizado a admin',
        credentials: {
          username: adminData.username,
          email: adminData.email,
          password: adminData.password
        }
      })
    } else {
      // Crear nuevo usuario admin
      const [result] = await db.execute(
        `INSERT INTO users 
         (username, email, password, full_name, phone, is_admin, is_driver, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          adminData.username,
          adminData.email,
          hashedPassword,
          adminData.full_name,
          adminData.phone,
          adminData.is_admin,
          adminData.is_driver,
          adminData.active
        ]
      ) as any[]

      return NextResponse.json({
        success: true,
        message: 'Nuevo usuario admin creado correctamente',
        userId: result.insertId,
        credentials: {
          username: adminData.username,
          email: adminData.email,
          password: adminData.password
        }
      })
    }

  } catch (error: any) {
    console.error('❌ Error creando usuario admin:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar usuarios admin existentes
    const [admins] = await db.execute(
      'SELECT id, username, email, full_name, is_admin, active FROM users WHERE is_admin = 1'
    ) as any[]

    return NextResponse.json({
      success: true,
      admins: admins
    })

  } catch (error: any) {
    console.error('❌ Error consultando admins:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}