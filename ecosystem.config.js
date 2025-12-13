module.exports = {
  apps: [{
    name: 'restaurante',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/restaurante',
    instances: 1, // Cambiar a 'max' para múltiples instancias
    exec_mode: 'fork', // Cambiar a 'cluster' para múltiples instancias
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/restaurante-error.log',
    out_file: '/var/log/pm2/restaurante-out.log',
    log_file: '/var/log/pm2/restaurante.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    restart_delay: 4000
  }]
}