#!/usr/bin/env node

/**
 * Script para verificar la estructura de la base de datos
 * Uso: node check-database.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
};

async function checkDatabase() {
  let connection;
  
  try {
    console.log('🔍 Verificando estructura de la base de datos...');
    console.log('===============================================');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos:', process.env.DB_NAME);
    console.log('');
    
    // 1. Mostrar todas las tablas
    console.log('📋 TABLAS EXISTENTES:');
    console.log('--------------------');
    const [tables] = await connection.execute('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('❌ No se encontraron tablas');
      return;
    }
    
    const tableNames = tables.map(row => Object.values(row)[0]);
    tableNames.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });
    
    console.log('');
    
    // 2. Verificar tablas relacionadas con órdenes
    console.log('🛒 VERIFICANDO TABLAS DE ÓRDENES:');
    console.log('--------------------------------');
    
    const orderTables = ['orders', 'order_items', 'orders_mysql', 'driver_assignments', 'inventory_movements'];
    
    for (const tableName of orderTables) {
      try {
        const [result] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`✅ ${tableName}: ${result[0].count} registros`);
      } catch (error) {
        console.log(`❌ ${tableName}: No existe`);
      }
    }
    
    console.log('');
    
    // 3. Verificar tablas de usuarios y productos (que NO se van a borrar)
    console.log('👥 VERIFICANDO TABLAS QUE SE MANTIENEN:');
    console.log('-------------------------------------');
    
    const keepTables = ['users', 'products', 'categories', 'business_info'];
    
    for (const tableName of keepTables) {
      try {
        const [result] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`✅ ${tableName}: ${result[0].count} registros`);
      } catch (error) {
        console.log(`❌ ${tableName}: No existe`);
      }
    }
    
    console.log('');
    
    // 4. Si existe la tabla orders, mostrar algunas órdenes de ejemplo
    try {
      const [orders] = await connection.execute('SELECT id, created_at, total, status FROM orders LIMIT 5');
      if (orders.length > 0) {
        console.log('📋 EJEMPLO DE ÓRDENES (últimas 5):');
        console.log('----------------------------------');
        orders.forEach(order => {
          console.log(`ID: ${order.id}, Fecha: ${order.created_at}, Total: $${order.total}, Estado: ${order.status}`);
        });
        console.log('');
      }
    } catch (error) {
      console.log('ℹ️  No hay tabla orders o está vacía');
    }
    
    console.log('');
    console.log('🎯 RESUMEN:');
    console.log('----------');
    console.log(`📊 Total de tablas: ${tableNames.length}`);
    
    // Identificar qué tablas de órdenes existen
    const existingOrderTables = [];
    for (const tableName of orderTables) {
      if (tableNames.includes(tableName)) {
        existingOrderTables.push(tableName);
      }
    }
    
    console.log(`🛒 Tablas de órdenes encontradas: ${existingOrderTables.join(', ') || 'Ninguna'}`);
    console.log('');
    
    if (existingOrderTables.length > 0) {
      console.log('✅ Se pueden limpiar las siguientes tablas:');
      existingOrderTables.forEach(table => {
        console.log(`   - ${table}`);
      });
    } else {
      console.log('ℹ️  No hay tablas de órdenes para limpiar');
    }
    
  } catch (error) {
    console.error('❌ Error al verificar la base de datos:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el script
if (require.main === module) {
  checkDatabase();
}

module.exports = { checkDatabase };