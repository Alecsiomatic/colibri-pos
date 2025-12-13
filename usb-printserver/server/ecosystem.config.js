module.exports = {
  apps: [{
    name: 'print-server',
    script: './index.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      PRINTER_IP: '192.168.100.101',
      PRINTER_PORT: 9100,
      TZ: 'America/Mexico_City'
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true
  }]
};
