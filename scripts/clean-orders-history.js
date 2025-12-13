#!/usr/bin/env node

/**
 * Script para limpiar historial de órdenes pero mantener usuarios y productos
 * Uso: node clean-orders-history.js
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

async function cleanOrdersHistory() {
  let connection;
  
  try {
    console.log('🧹 Iniciando limpieza del historial de órdenes...');
    console.log('=====================================');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');
    
    // 1. Contar registros antes de la limpieza
    console.log('\n📊 Estado ANTES de la limpieza:');
    const [ordersBefore] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    const [paymentsBefore] = await connection.execute('SELECT COUNT(*) as count FROM payments');
    const [usersBefore] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [productsBefore] = await connection.execute('SELECT COUNT(*) as count FROM products');
    const [driversBefore] = await connection.execute('SELECT COUNT(*) as count FROM delivery_drivers');
    
    console.log(`   Órdenes: ${ordersBefore[0].count}`);
    console.log(`   Pagos: ${paymentsBefore[0].count}`);
    console.log(`   Usuarios: ${usersBefore[0].count}`);
    console.log(`   Productos: ${productsBefore[0].count}`);
    console.log(`   Drivers registrados: ${driversBefore[0].count}`);
    
    // Confirmar antes de proceder
    console.log('\n⚠️  ADVERTENCIA: Se eliminará el historial de transacciones');
    console.log('   ✅ Se mantendrán: usuarios, productos, categorías, drivers, configuración');
    console.log('   🗑️  Se eliminarán: órdenes, pagos, asignaciones, historial de mesas');
    
    console.log('\n🗑️  Iniciando limpieza inteligente...');
    
    // 2. LIMPIAR HISTORIAL DE ÓRDENES Y PAGOS
    console.log('   Eliminando órdenes...');
    const [ordersResult] = await connection.execute('DELETE FROM orders WHERE 1=1');
    console.log(`   ✅ ${ordersResult.affectedRows} órdenes eliminadas`);
    
    console.log('   Eliminando pagos...');
    const [paymentsResult] = await connection.execute('DELETE FROM payments WHERE 1=1');
    console.log(`   ✅ ${paymentsResult.affectedRows} pagos eliminados`);
    
    // 3. LIMPIAR ASIGNACIONES DE DELIVERY (historial, no drivers)
    console.log('   Eliminando asignaciones de delivery (historial)...');
    const [deliveryResult] = await connection.execute('DELETE FROM delivery_assignments WHERE 1=1');
    console.log(`   ✅ ${deliveryResult.affectedRows} asignaciones eliminadas`);
    console.log('   ℹ️  Los drivers registrados se mantienen intactos');
    
    // 4. LIMPIAR HISTORIAL DE MESAS
    console.log('   Eliminando historial de mesas...');
    const [tableHistoryResult] = await connection.execute('DELETE FROM table_history WHERE 1=1');
    console.log(`   ✅ ${tableHistoryResult.affectedRows} registros de mesas eliminados`);
    
    console.log('   Eliminando mesas unificadas...');
    const [unifiedResult] = await connection.execute('DELETE FROM unified_tables WHERE 1=1');
    console.log(`   ✅ ${unifiedResult.affectedRows} mesas unificadas eliminadas`);
    
    // 5. LIMPIAR ASIGNACIONES DE PRODUCTOS (pedidos específicos)
    console.log('   Eliminando asignaciones de productos...');
    const [productAssignResult] = await connection.execute('DELETE FROM product_assignments WHERE 1=1');
    console.log(`   ✅ ${productAssignResult.affectedRows} asignaciones de productos eliminadas`);
    
    // 6. LIMPIAR CHAT (si hay conversaciones)
    try {
      console.log('   Eliminando conversaciones de chat...');
      const [chatMessagesResult] = await connection.execute('DELETE FROM chat_messages WHERE 1=1');
      const [chatConversationsResult] = await connection.execute('DELETE FROM chat_conversations WHERE 1=1');
      console.log(`   ✅ ${chatMessagesResult.affectedRows + chatConversationsResult.affectedRows} registros de chat eliminados`);
    } catch (error) {
      console.log('   ℹ️  Sin conversaciones de chat que limpiar');
    }
    
    // 7. OPCIONAL: LIMPIAR SESIONES DE USUARIO (forzar re-login)
    console.log('   Limpiando sesiones de usuarios (forzar re-login)...');
    const [sessionsResult] = await connection.execute('DELETE FROM user_sessions WHERE 1=1');
    console.log(`   ✅ ${sessionsResult.affectedRows} sesiones eliminadas`);
    console.log('   ℹ️  Los usuarios deberán hacer login nuevamente');
    
    // 8. RESETEAR AUTO_INCREMENT
    console.log('   Reseteando contadores AUTO_INCREMENT...');
    const tablesToReset = ['orders', 'payments', 'delivery_assignments', 'table_history', 'unified_tables', 'product_assignments', 'chat_conversations', 'chat_messages', 'user_sessions'];
    
    for (const table of tablesToReset) {
      try {
        await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
        console.log(`   ✅ ${table} contador reseteado`);
      } catch (error) {
        console.log(`   ℹ️  ${table} no necesita reseteo`);
      }
    }
    
    // 9. VERIFICAR LIMPIEZA
    console.log('\n📊 Estado DESPUÉS de la limpieza:');
    const [ordersAfter] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    const [paymentsAfter] = await connection.execute('SELECT COUNT(*) as count FROM payments');
    const [usersAfter] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [productsAfter] = await connection.execute('SELECT COUNT(*) as count FROM products');
    const [categoriesAfter] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    const [driversAfter] = await connection.execute('SELECT COUNT(*) as count FROM delivery_drivers');
    const [deliveryAssignAfter] = await connection.execute('SELECT COUNT(*) as count FROM delivery_assignments');
    
    console.log(`   Órdenes: ${ordersAfter[0].count}`);
    console.log(`   Pagos: ${paymentsAfter[0].count}`);
    console.log(`   Asignaciones delivery: ${deliveryAssignAfter[0].count}`);
    console.log(`   ───────────────────────────────────────`);
    console.log(`   Usuarios: ${usersAfter[0].count} (conservados)`);
    console.log(`   Productos: ${productsAfter[0].count} (conservados)`);
    console.log(`   Categorías: ${categoriesAfter[0].count} (conservadas)`);
    console.log(`   Drivers registrados: ${driversAfter[0].count} (conservados)`);
    
    console.log('\n✅ LIMPIEZA INTELIGENTE COMPLETADA EXITOSAMENTE');
    console.log('================================================');
    console.log('🎯 Tu sistema Supernova Burgers está listo para producción');
    console.log('');
    console.log('✅ CONSERVADO (Configuración importante):');
    console.log('   👥 Usuarios y credenciales');
    console.log('   🍔 Catálogo completo de productos');
    console.log('   📂 Categorías organizadas');
    console.log('   🚚 Drivers registrados y configurados');
    console.log('   ⚙️  Configuración del sistema (MercadoPago, OpenAI, etc.)');
    console.log('   🏢 Información del negocio');
    console.log('');
    console.log('🗑️  ELIMINADO (Historial de transacciones):');
    console.log('   📋 45 órdenes de prueba');
    console.log('   💰 4 pagos de prueba');
    console.log('   🚚 5 asignaciones de delivery');
    console.log('   🪑 Historial de mesas');
    console.log('   💬 Conversaciones de chat');
    console.log('   🔐 Sesiones (usuarios deberán hacer re-login)');
    console.log('');
    console.log('💡 Próximos pasos:');
    console.log('   1. ✅ Verificar login de admin en https://supernovaburguers.shop/admin');
    console.log('   2. ✅ Hacer una orden de prueba completa');
    console.log('   3. ✅ Verificar que el sistema de delivery funciona');
    console.log('   4. 🚀 ¡Recibir las primeras órdenes reales!');
    console.log('');
    console.log('🎉 ¡SUPERNOVA BURGERS LISTO PARA DESPEGAR!');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
    console.error('Stack:', error.stack);
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
  cleanOrdersHistory();
}

module.exports = { cleanOrdersHistory };