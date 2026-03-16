const m = require('mysql2/promise');
(async () => {
  const p = m.createPool({
    host: 'srv440.hstgr.io',
    user: 'u191251575_colibridemo',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_colibridemo',
    port: 3306
  });
  const [r] = await p.query('SELECT da.id, da.order_id, da.driver_id, da.status, dd.name as driver_name FROM delivery_assignments da JOIN delivery_drivers dd ON dd.id=da.driver_id ORDER BY da.id DESC LIMIT 5');
  console.log(JSON.stringify(r, null, 2));
  const [r2] = await p.query('SELECT id, status, delivery_type, delivery_address FROM orders WHERE delivery_type="delivery" ORDER BY id DESC LIMIT 3');
  console.log('\nRecent delivery orders:');
  console.log(JSON.stringify(r2, null, 2));
  p.end();
})();
