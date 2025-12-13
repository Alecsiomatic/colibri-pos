import mysql from 'mysql2/promise'

const dbConfig = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu'
}

async function checkMPSettings() {
  let connection
  
  try {
    console.log('🔍 Verificando configuración de Mercado Pago...\n')
    connection = await mysql.createConnection(dbConfig)
    
    const [rows] = await connection.execute(
      'SELECT * FROM system_settings WHERE setting_key LIKE "mercadopago%"'
    )
    
    const settings = rows as any[]
    
    if (settings.length === 0) {
      console.log('❌ No se encontró configuración de Mercado Pago')
      return
    }
    
    console.log('📋 Configuraciones actuales:\n')
    
    settings.forEach(setting => {
      const value = setting.setting_value
      let displayValue = value
      
      // Ocultar tokens sensibles
      if (setting.setting_key === 'mercadopago_access_token' && value && value !== '') {
        displayValue = value.substring(0, 20) + '...' + value.substring(value.length - 10)
      }
      
      console.log(`  ${setting.setting_key}:`)
      console.log(`    Valor: ${displayValue || '(vacío)'}`)
      console.log(`    Descripción: ${setting.description}`)
      console.log(`    Encriptado: ${setting.is_encrypted ? 'Sí' : 'No'}`)
      console.log(`    Actualizado: ${setting.updated_at}`)
      console.log('')
    })
    
    // Verificar estado
    const publicKey = settings.find(s => s.setting_key === 'mercadopago_public_key')?.setting_value
    const accessToken = settings.find(s => s.setting_key === 'mercadopago_access_token')?.setting_value
    const enabled = settings.find(s => s.setting_key === 'mercadopago_enabled')?.setting_value
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 Estado de la integración:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    const hasPublicKey = publicKey && publicKey !== ''
    const hasAccessToken = accessToken && accessToken !== ''
    const isEnabled = enabled === 'true'
    
    console.log(`  Public Key:     ${hasPublicKey ? '✅ Configurado' : '❌ Falta'}`)
    console.log(`  Access Token:   ${hasAccessToken ? '✅ Configurado' : '❌ Falta'}`)
    console.log(`  Estado:         ${isEnabled ? '✅ Habilitado' : '⚠️ Deshabilitado'}`)
    
    console.log('')
    
    if (hasPublicKey && hasAccessToken && isEnabled) {
      console.log('✅ Mercado Pago está completamente configurado y habilitado')
    } else if (hasPublicKey && hasAccessToken && !isEnabled) {
      console.log('⚠️ Mercado Pago está configurado pero DESHABILITADO')
      console.log('   Ve a /admin/settings para habilitarlo')
    } else {
      console.log('❌ Mercado Pago NO está completamente configurado')
      console.log('   Ve a /admin/settings para configurar las credenciales')
    }
    
    console.log('')
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

checkMPSettings()
