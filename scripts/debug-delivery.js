const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u191251575_colibridemo',
    password: process.env.DB_PASSWORD,
    database: 'u191251575_colibridemo'
  });

  // Reset assignment to pending
  await c.query("UPDATE delivery_assignments SET status = 'pending', accepted_at = NULL WHERE id = 1");
  // Reset order status
  await c.query("UPDATE orders SET status = 'asignado_repartidor' WHERE id = 52");
  // Reset driver availability
  await c.query("UPDATE delivery_drivers SET is_available = 1 WHERE id = 3");
  console.log('Reset done');
  
  const [da] = await c.query('SELECT id, status, order_id FROM delivery_assignments WHERE id = 1');
  console.log('Assignment:', JSON.stringify(da));

  await c.end();
})().catch(e => console.error(e.message));
