const mysql = require('mysql2/promise')

;(async () => {
  try {
    const config = {
      host: process.env.MYSQL_HOST || process.env.DB_HOST || 'srv440.hstgr.io',
      user: process.env.MYSQL_USER || process.env.DB_USER || 'u191251575_manu',
      password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || 'Cerounocero.com20182417',
      database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'u191251575_manu',
      port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306'),
      connectTimeout: 5000,
    }

    console.log('Trying DB config:', { host: config.host, user: config.user, database: config.database, port: config.port })

    const conn = await mysql.createConnection(config)
    const [rows] = await conn.execute('SELECT NOW() as now')
    console.log('DB OK, NOW =', rows[0])
    await conn.end()
  } catch (e) {
    console.error('DB connection failed:', e.message)
    process.exit(1)
  }
})()
