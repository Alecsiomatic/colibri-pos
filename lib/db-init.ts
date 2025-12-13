// Nuevo archivo para manejar la inicialización automática de la base de datos
import path from "path"
import fs from "fs"
import sqlite3 from "sqlite3"
import { open } from "sqlite"
import bcrypt from "bcryptjs"

// Variable para rastrear si la base de datos ya ha sido inicializada
let isDbInitialized = false

export async function ensureDbInitialized() {
  // Si ya está inicializada, no hacer nada
  if (isDbInitialized) {
    return
  }

  const dbPath = path.join(process.cwd(), "restaurant.db")
  const dbExists = fs.existsSync(dbPath)

  // Si la base de datos no existe, crearla
  if (!dbExists) {
    console.log("Base de datos no encontrada. Inicializando...")
    await initializeDatabase(dbPath)
  } else {
    // Verificar que la base de datos tiene la estructura correcta
    try {
      const db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      })

      // Verificar si existe la tabla de usuarios
      const userTable = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")

      if (!userTable) {
        console.log("Estructura de base de datos incompleta. Reinicializando...")
        await db.close()
        await initializeDatabase(dbPath)
      } else {
        // Verificar si existe el usuario admin
        const adminUser = await db.get("SELECT * FROM users WHERE username = ?", ["admin"])
        if (!adminUser) {
          console.log("Usuario admin no encontrado. Creando...")
          const hashedPassword = await bcrypt.hash("admin123", 10)
          await db.run("INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)", ["admin", hashedPassword, 1])
        }
        await db.close()
      }
    } catch (error) {
      console.error("Error al verificar la base de datos:", error)
      console.log("Reinicializando base de datos debido a error...")
      await initializeDatabase(dbPath)
    }
  }

  isDbInitialized = true
}

async function initializeDatabase(dbPath: string) {
  // Si la base de datos existe pero está corrupta, eliminarla
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath)
    } catch (error) {
      console.error("Error al eliminar base de datos corrupta:", error)
    }
  }

  try {
    // Crear nueva base de datos
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    // Crear tablas
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        isAdmin BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT DEFAULT 'pendiente',
        customerInfo TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `)

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash("admin123", 10)
    await db.run("INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)", ["admin", hashedPassword, 1])

    await db.close()
    console.log("Base de datos inicializada correctamente")
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error)
    throw new Error("No se pudo inicializar la base de datos")
  }
}
