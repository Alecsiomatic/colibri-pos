const mysql = require('mysql2/promise');

async function updateOpenAIKey() {
  // Prompt para nueva API key
  console.log('🔑 Para obtener una API key válida:');
  console.log('1. Ve a: https://platform.openai.com/account/api-keys');
  console.log('2. Crea una nueva API key');
  console.log('3. Asegúrate de tener créditos en tu cuenta\n');
  
  // API key ejemplo (necesitas reemplazar con una real)
  const newApiKey = 'sk-proj-TU_NUEVA_API_KEY_AQUI'; // ⚠️ REEMPLAZAR CON TU API KEY REAL
  
  if (newApiKey === 'sk-proj-TU_NUEVA_API_KEY_AQUI') {
    console.log('❌ Por favor, edita este archivo y reemplaza la variable newApiKey con tu API key real de OpenAI');
    console.log('📝 Archivo: test-openai-direct.js');
    console.log('🔍 Busca la línea: const newApiKey = ...');
    return;
  }
  
  const connection = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu',
    port: 3306,
    charset: 'utf8mb4'
  });

  try {
    console.log('🔄 Actualizando API key en la base de datos...');
    
    await connection.execute(
      'UPDATE business_info SET openai_api_key = ?, enable_ai_reports = 1 WHERE id = 1',
      [newApiKey]
    );
    
    console.log('✅ API key actualizada correctamente');
    console.log(`🔑 Nueva key: ${newApiKey.substring(0, 20)}...`);
    
    // Verificar que se guardó
    const [rows] = await connection.execute(
      'SELECT openai_api_key, enable_ai_reports FROM business_info WHERE id = 1'
    );
    
    const config = rows[0];
    console.log(`✅ Verificación: ${config.openai_api_key.substring(0, 20)}...`);
    console.log(`✅ IA habilitada: ${config.enable_ai_reports ? 'SÍ' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

updateOpenAIKey();