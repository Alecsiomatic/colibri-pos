import path from "path"
import fs from "fs"
import sqlite3 from "sqlite3"
import { open } from "sqlite"
import bcrypt from "bcryptjs"

async function initDb() {
  console.log("Iniciando inicialización de la base de datos...")

  const dbPath = path.join(process.cwd(), "restaurant.db")

  // Verificar si la base de datos existe y eliminarla para empezar desde cero
  if (fs.existsSync(dbPath)) {
    console.log(`Base de datos existente encontrada en: ${dbPath}`)
    console.log("Eliminando base de datos existente...")
    fs.unlinkSync(dbPath)
    console.log("Base de datos eliminada.")
  }

  console.log("Creando nueva base de datos...")

  try {
    // Abrir conexión a la base de datos
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    console.log("Conexión a la base de datos establecida.")

    // Crear tabla de usuarios
    console.log("Creando tabla de usuarios...")
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        isAdmin BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Crear tabla de pedidos
    console.log("Creando tabla de pedidos...")
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

    // Crear usuario administrador
    console.log("Creando usuario administrador...")
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash("admin123", salt)

    await db.run("INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)", ["admin", hashedPassword, 1])

    // Verificar que el usuario se creó correctamente
    const adminUser = await db.get("SELECT * FROM users WHERE username = ?", ["admin"])
    if (adminUser) {
      console.log("Usuario administrador creado correctamente.")
    } else {
      console.error("Error: No se pudo verificar la creación del usuario administrador.")
    }

    // Cerrar la conexión
    await db.close()
    console.log("Conexión a la base de datos cerrada.")

    console.log("Inicialización de la base de datos completada con éxito.")

    // Verificar permisos del archivo
    const stats = fs.statSync(dbPath)
    console.log(`Permisos del archivo de base de datos: ${stats.mode.toString(8).slice(-3)}`)
    console.log(`Tamaño de la base de datos: ${(stats.size / 1024).toFixed(2)} KB`)
  } catch (error) {
    console.error("Error durante la inicialización de la base de datos:", error)
    throw error
  }
}

// Ejecutar la inicialización
initDb().catch((error) => {
  console.error("Error fatal durante la inicialización:", error)
  process.exit(1)
})
