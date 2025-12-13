const mysql = require('mysql2/promise');

async function checkOpenAIConfig() {
  const connection = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu',
    port: 3306,
    charset: 'utf8mb4'
  });

  try {
    const [rows] = await connection.execute(
      'SELECT openai_api_key, openai_model, enable_ai_reports FROM business_info WHERE id = 1'
    );
    
    if (rows.length > 0) {
      const config = rows[0];
      console.log('=== CONFIGURACIÓN OPENAI ===');
      console.log('API Key:', config.openai_api_key ? `${config.openai_api_key.substring(0, 20)}...` : 'NO CONFIGURADA');
      console.log('Modelo:', config.openai_model || 'No configurado');
      console.log('IA Habilitada:', config.enable_ai_reports ? 'SÍ' : 'NO');
      
      if (!config.openai_api_key) {
        console.log('\n❌ ERROR: No hay API key configurada');
      } else if (!config.enable_ai_reports) {
        console.log('\n❌ ERROR: IA deshabilitada');
      } else {
        console.log('\n✅ Configuración parece correcta');
      }
    } else {
      console.log('❌ No se encontró configuración en business_info');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkOpenAIConfig();