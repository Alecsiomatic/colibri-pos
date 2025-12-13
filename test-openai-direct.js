const mysql = require('mysql2/promise');
const OpenAI = require('openai');

async function testOpenAIConnection() {
  const connection = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu',
    port: 3306,
    charset: 'utf8mb4'
  });

  try {
    // Obtener configuración de la BD
    const [rows] = await connection.execute(
      'SELECT openai_api_key, openai_model, enable_ai_reports FROM business_info WHERE id = 1'
    );
    
    const businessInfo = rows[0];
    console.log('=== CONFIGURACIÓN DESDE BD ===');
    console.log('API Key:', businessInfo.openai_api_key ? `${businessInfo.openai_api_key.substring(0, 20)}...` : 'NO CONFIGURADA');
    console.log('Modelo:', businessInfo.openai_model);
    console.log('IA Habilitada:', businessInfo.enable_ai_reports);
    
    if (!businessInfo.openai_api_key) {
      console.log('❌ No hay API key configurada');
      return;
    }
    
    // Test directo con OpenAI
    console.log('\n🧪 Probando conexión con OpenAI...');
    const openai = new OpenAI({
      apiKey: businessInfo.openai_api_key
    });
    
    const completion = await openai.chat.completions.create({
      model: businessInfo.openai_model || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Responde solo con: "Conexión exitosa con OpenAI"'
        }
      ],
      max_tokens: 10,
      temperature: 0
    });
    
    console.log('✅ ÉXITO:', completion.choices[0]?.message?.content);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
      console.error('Code:', error.code);
    }
  } finally {
    await connection.end();
  }
}

testOpenAIConnection();