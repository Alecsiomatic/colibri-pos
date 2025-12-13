#!/usr/bin/env node

/**
 * Script para analizar TODAS las tablas y su contenido
 * Nos ayuda a decidir qué limpiar y qué conservar
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

async function analyzeAllTables() {
  let connection;
  
  try {
    console.log('🔍 ANÁLISIS COMPLETO DE LA BASE DE DATOS');
    console.log('=========================================');
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a:', process.env.DB_NAME);
    console.log('');
    
    // Obtener todas las tablas
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log(`📊 Total de tablas encontradas: ${tableNames.length}`);
    console.log('');
    
    // Analizar cada tabla
    for (const tableName of tableNames) {
      try {
        // Contar registros
        const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = countResult[0].count;
        
        // Obtener estructura de la tabla
        const [structure] = await connection.execute(`DESCRIBE ${tableName}`);
        const columns = structure.map(col => col.Field).join(', ');
        
        // Obtener algunos datos de muestra si hay registros
        let sampleData = '';
        if (count > 0 && count <= 5) {
          const [sample] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 3`);
          if (sample.length > 0) {
            sampleData = '\n   📝 Muestra: ' + JSON.stringify(sample[0], null, 2).split('\n').join('\n   ');
          }
        }
        
        // Clasificar la tabla
        let category = '🗂️  OTROS';
        let shouldKeep = '🤔 REVISAR';
        
        if (tableName.includes('order') || tableName.includes('payment')) {
          category = '🛒 ÓRDENES/PAGOS';
          shouldKeep = '🗑️  LIMPIAR';
        } else if (tableName.includes('user') || tableName === 'users') {
          category = '👥 USUARIOS';
          shouldKeep = '✅ MANTENER';
        } else if (tableName.includes('product') || tableName === 'products' || tableName === 'categories') {
          category = '🍔 PRODUCTOS';
          shouldKeep = '✅ MANTENER';
        } else if (tableName.includes('business') || tableName.includes('system') || tableName.includes('config')) {
          category = '⚙️  CONFIGURACIÓN';
          shouldKeep = '✅ MANTENER';
        } else if (tableName.includes('delivery') || tableName.includes('driver')) {
          category = '🚚 DELIVERY';
          shouldKeep = '🤔 REVISAR';
        } else if (tableName.includes('chat') || tableName.includes('message')) {
          category = '💬 CHAT';
          shouldKeep = '🗑️  LIMPIAR';
        } else if (tableName.includes('inventory') || tableName.includes('stock')) {
          category = '📦 INVENTARIO';
          shouldKeep = '🤔 REVISAR';
        } else if (tableName.includes('table') || tableName.includes('unified')) {
          category = '🪑 MESAS';
          shouldKeep = '🗑️  LIMPIAR';
        }
        
        console.log(`${category} | ${shouldKeep}`);
        console.log(`📋 Tabla: ${tableName}`);
        console.log(`📊 Registros: ${count}`);
        console.log(`🔧 Columnas: ${columns}`);
        if (sampleData) {
          console.log(sampleData);
        }
        console.log('─'.repeat(80));
        
      } catch (error) {
        console.log(`❌ Error analizando ${tableName}:`, error.message);
        console.log('─'.repeat(80));
      }
    }
    
    console.log('');
    console.log('🎯 RECOMENDACIONES DE LIMPIEZA:');
    console.log('==============================');
    console.log('');
    console.log('✅ MANTENER (Configuración importante):');
    console.log('   - users (usuarios del sistema)');
    console.log('   - products (catálogo de productos)');
    console.log('   - categories (categorías de productos)');
    console.log('   - business_info (información del negocio)');
    console.log('   - system_* (configuración del sistema)');
    console.log('   - drivers (repartidores registrados)');
    console.log('   - delivery_drivers (configuración de drivers)');
    console.log('');
    console.log('🗑️  LIMPIAR (Historial de transacciones):');
    console.log('   - orders (órdenes completadas)');
    console.log('   - payments (pagos realizados)');
    console.log('   - delivery_assignments (asignaciones de entrega)');
    console.log('   - chat_* (conversaciones)');
    console.log('   - table_history (historial de mesas)');
    console.log('   - unified_tables (mesas unificadas)');
    console.log('');
    console.log('🤔 REVISAR (Decidir caso por caso):');
    console.log('   - inventory_movements (movimientos de inventario)');
    console.log('   - stock_changes (cambios de stock)');
    console.log('   - inventory (stock actual)');
    console.log('   - user_sessions (sesiones activas)');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  analyzeAllTables();
}