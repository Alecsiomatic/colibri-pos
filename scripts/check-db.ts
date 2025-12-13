// Nuevo script para verificar la base de datos
import path from "path"
import fs from "fs"
import sqlite3 from "sqlite3"
import { open } from "sqlite"

async function checkDatabase() {
  const dbPath = path.join(process.cwd(), "restaurant.db")

  console.log("Verificando base de datos...")

  // Comprobar si el archivo existe
  if (fs.existsSync(dbPath)) {
    console.log(`Base de datos encontrada en: ${dbPath}`)
    console.log(`Tamaño: ${(fs.statSync(dbPath).size / 1024).toFixed(2)} KB`)
    console.log(`Permisos: ${fs.statSync(dbPath).mode.toString(8).slice(-3)}`)
  } else {
    console.log(`La base de datos no existe en: ${dbPath}`)
    console.log("Intentando crear la base de datos...")
  }

  // Intentar abrir la base de datos
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    console.log("Conexión a la base de datos establecida correctamente")

    // Verificar tablas
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'")
    console.log("Tablas encontradas:", tables.map((t) => t.name).join(", "))

    // Verificar usuarios
    const users = await db.all("SELECT id, username, isAdmin FROM users")
    console.log(`Usuarios encontrados: ${users.length}`)
    users.forEach((user) => {
      console.log(`- ID: ${user.id}, Usuario: ${user.username}, Admin: ${user.isAdmin ? "Sí" : "No"}`)
    })

    await db.close()
    console.log("Verificación completada con éxito")
  } catch (error) {
    console.error("Error al verificar la base de datos:", error)
  }
}

checkDatabase().catch((error) => {
  console.error("Error inesperado:", error)
  process.exit(1)
})
