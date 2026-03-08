const { executeQuery } = require('./lib/mysql-db.ts');

(async () => {
  try {
    console.log('Creando tabla modifier_options...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS modifier_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        price_adjustment DECIMAL(10,2) DEFAULT 0.00,
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES modifier_groups(id) ON DELETE CASCADE,
        INDEX idx_group_id (group_id),
        INDEX idx_is_active (is_active)
      )
    `;
    
    await executeQuery(createTableSQL);
    console.log('✅ Tabla modifier_options creada exitosamente');
    
    // Verificar estructura
    const structure = await executeQuery('DESCRIBE modifier_options');
    console.log('\n📋 Estructura de la tabla:');
    console.table(structure);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
