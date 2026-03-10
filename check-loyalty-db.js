const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'srv440.hstgr.io',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'u191251575_colibridemo',
    password: process.env.DB_PASSWORD || 'Cerounocero.com20182417',
    database: process.env.DB_NAME || 'u191251575_colibridemo'
  });
  
  try {
    const [r] = await c.execute('DESCRIBE loyalty_config');
    console.log('loyalty_config columns:', JSON.stringify(r.map(x => x.Field)));
  } catch(e) {
    console.log('loyalty_config error:', e.message);
  }

  try {
    const [r] = await c.execute('DESCRIBE loyalty_points');
    console.log('loyalty_points columns:', JSON.stringify(r.map(x => x.Field)));
  } catch(e) {
    console.log('loyalty_points error:', e.message);
  }

  try {
    const [r] = await c.execute('DESCRIBE users');
    console.log('users columns:', JSON.stringify(r.map(x => x.Field)));
  } catch(e) {
    console.log('users error:', e.message);
  }

  await c.end();
})().catch(e => console.error(e.message));
