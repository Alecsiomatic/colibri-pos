const mysql = require('mysql2/promise');

const OLD_DB = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu',
  port: 3306
};

const NEW_DB = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_colibridemo',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_colibridemo',
  port: 3306
};

async function cloneDatabase() {
  let oldConn, newConn;
  
  try {
    console.log('🔄 CLONANDO BASE DE DATOS\n');
    console.log('📂 Origen: u191251575_manu');
    console.log('📂 Destino: u191251575_colibridemo\n');
    
    // Conectar a ambas bases de datos
    console.log('🔌 Conectando a DB antigua...');
    oldConn = await mysql.createConnection(OLD_DB);
    console.log('✅ Conectado a DB antigua\n');
    
    console.log('🔌 Conectando a DB nueva...');
    newConn = await mysql.createConnection(NEW_DB);
    console.log('✅ Conectado a DB nueva\n');
    
    // Deshabilitar foreign key checks
    await newConn.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('🔓 Foreign key checks deshabilitados\n');
    
    // Obtener lista de tablas
    const [tables] = await oldConn.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log(`📋 Encontradas ${tableNames.length} tablas:\n${tableNames.join(', ')}\n`);
    
    // Copiar cada tabla
    for (const tableName of tableNames) {
      console.log(`📦 Copiando tabla: ${tableName}...`);
      
      // Obtener estructura de la tabla
      const [createTable] = await oldConn.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createSQL = createTable[0]['Create Table'];
      
      // Eliminar tabla si existe en destino
      await newConn.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      
      // Crear tabla en destino
      await newConn.query(createSQL);
      
      // Copiar datos
      const [rows] = await oldConn.query(`SELECT * FROM \`${tableName}\``);
      
      if (rows.length > 0) {
        // Obtener nombres de columnas
        const [columns] = await oldConn.query(`SHOW COLUMNS FROM \`${tableName}\``);
        const columnNames = columns.map(col => col.Field);
        
        // Insertar datos en lotes
        const batchSize = 100;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const placeholders = batch.map(() => `(${columnNames.map(() => '?').join(',')})`).join(',');
          const values = batch.flatMap(row => columnNames.map(col => row[col]));
          
          await newConn.query(
            `INSERT INTO \`${tableName}\` (${columnNames.map(c => `\`${c}\``).join(',')}) VALUES ${placeholders}`,
            values
          );
        }
        console.log(`   ✅ ${rows.length} registros copiados`);
      } else {
        console.log(`   ⚪ Tabla vacía`);
      }
    }
    
    // Rehabilitar foreign key checks
    await newConn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n🔒 Foreign key checks rehabilitados');
    
    console.log('\n🎉 ¡BASE DE DATOS CLONADA EXITOSAMENTE!\n');
    
    // Ahora crear usuarios demo en la NUEVA base de datos
    console.log('🔐 Creando usuarios demo en la nueva DB...\n');
    
    const passwordHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    
    const demoUsers = [
      {
        name: 'Administrador Demo',
        email: 'admin@supernova.com',
        password: passwordHash,
        is_admin: 1,
        is_waiter: 0,
        is_driver: 0,
        role: 'Admin'
      },
      {
        name: 'Cajero Demo',
        email: 'cajero@supernova.com',
        password: passwordHash,
        is_admin: 0,
        is_waiter: 0,
        is_driver: 0,
        role: 'Cajero'
      },
      {
        name: 'Mesero Demo',
        email: 'mesero@supernova.com',
        password: passwordHash,
        is_admin: 0,
        is_waiter: 1,
        is_driver: 0,
        role: 'Mesero'
      },
      {
        name: 'Repartidor Demo',
        email: 'driver@supernova.com',
        password: passwordHash,
        is_admin: 0,
        is_waiter: 0,
        is_driver: 1,
        role: 'Repartidor'
      }
    ];
    
    // Eliminar usuarios demo anteriores si existen
    await newConn.execute(
      "DELETE FROM users WHERE email IN ('admin@supernova.com', 'cajero@supernova.com', 'mesero@supernova.com', 'driver@supernova.com')"
    );
    
    for (const user of demoUsers) {
      await newConn.execute(
        `INSERT INTO users (name, email, password, is_admin, is_waiter, is_driver, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [user.name, user.email, user.password, user.is_admin, user.is_waiter, user.is_driver]
      );
      console.log(`✨ ${user.role}: ${user.email}`);
    }
    
    console.log('\n📋 CREDENCIALES DEMO:');
    console.log('   👨‍💼 Admin:      admin@supernova.com / admin123     → /admin/dashboard');
    console.log('   💰 Cajero:     cajero@supernova.com / admin123    → /caja');
    console.log('   🍽️  Mesero:     mesero@supernova.com / admin123    → /mesero/mesas-abiertas');
    console.log('   🛵 Repartidor: driver@supernova.com / admin123    → /driver/dashboard');
    
    console.log('\n✅ TODO LISTO! Ahora actualiza el .env.local con las nuevas credenciales.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    if (oldConn) await oldConn.end();
    if (newConn) await newConn.end();
  }
}

cloneDatabase();
