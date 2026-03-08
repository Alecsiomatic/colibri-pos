# Instalación y Configuración en VPS

## 📋 Requisitos del Servidor

- **OS**: Ubuntu 20.04 LTS o superior
- **Node.js**: v18 o superior
- **MySQL**: v8.0 o superior  
- **Nginx**: Para proxy reverso
- **PM2**: Para gestión de procesos
- **Memoria RAM**: Mínimo 2GB
- **Espacio**: Mínimo 10GB

## 🚀 Pasos de Instalación

### 1. Preparar el Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Instalar Nginx
sudo apt install nginx -y

# Instalar PM2 globalmente
sudo npm install -g pm2 pnpm
```

### 2. Configurar MySQL

```bash
# Conectar a MySQL
sudo mysql -u root -p

# Crear base de datos y usuario
CREATE DATABASE restaurante_db;
CREATE USER 'restaurante_user'@'localhost' IDENTIFIED BY 'password_seguro';
GRANT ALL PRIVILEGES ON restaurante_db.* TO 'restaurante_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Subir y Configurar el Proyecto

```bash
# Crear directorio del proyecto
sudo mkdir -p /var/www/restaurante
sudo chown -R $USER:$USER /var/www/restaurante
cd /var/www/restaurante

# Clonar o subir archivos del proyecto
# (sube todo el contenido del proyecto aquí)

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.production .env.local
nano .env.local
# Editar con los valores reales del servidor
```

### 4. Variables de Entorno (.env.local)

```env
MYSQL_HOST=localhost
MYSQL_USER=restaurante_user
MYSQL_PASSWORD=password_seguro
MYSQL_DATABASE=restaurante_db
MYSQL_PORT=3306

JWT_SECRET=un_secreto_muy_seguro_y_unico
OPENAI_API_KEY=tu_openai_api_key_real
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
NODE_ENV=production
```

### 5. Construir el Proyecto

```bash
# Build para producción
pnpm build

# Crear directorio de uploads
sudo mkdir -p /var/www/uploads
sudo chown -R www-data:www-data /var/www/uploads
sudo chmod 755 /var/www/uploads
```

### 6. Configurar PM2

```bash
# Crear archivo ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'restaurante',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/restaurante',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/restaurante-error.log',
    out_file: '/var/log/pm2/restaurante-out.log',
    log_file: '/var/log/pm2/restaurante.log'
  }]
}
EOF

# Iniciar aplicación
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7. Configurar Nginx

```bash
# Crear configuración del sitio
sudo nano /etc/nginx/sites-available/restaurante

# Contenido del archivo:
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    # SSL Configuration (configurar con Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    # Upload size
    client_max_body_size 10M;

    # Static files
    location /_next/static/ {
        alias /var/www/restaurante/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Uploads
    location /uploads/ {
        alias /var/www/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/restaurante /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. Configurar SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Auto-renovación
sudo certbot renew --dry-run
```

### 9. Configurar Firewall

```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 10. Importar Datos Iniciales

```bash
# Conectar a MySQL e importar estructura inicial
mysql -u restaurante_user -p restaurante_db < database_structure.sql

# Crear usuario admin inicial
node scripts/create-admin-initial.js
```

## 🔧 Mantenimiento

### Comandos Útiles

```bash
# Ver logs de la aplicación
pm2 logs restaurante

# Reiniciar aplicación
pm2 restart restaurante

# Monitoreo
pm2 monit

# Backup de base de datos
mysqldump -u restaurante_user -p restaurante_db > backup_$(date +%Y%m%d).sql

# Ver estado de Nginx
sudo systemctl status nginx

# Renovar SSL
sudo certbot renew
```

### Actualizaciones

```bash
cd /var/www/restaurante
git pull origin main  # o sube nuevos archivos
pnpm install
pnpm build
pm2 restart restaurante
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **Error de conexión MySQL**: Verificar credenciales en .env.local
2. **Error 502 Bad Gateway**: Verificar que PM2 esté ejecutando la app
3. **Archivos no cargan**: Verificar permisos de /var/www/uploads
4. **SSL no funciona**: Verificar configuración de Certbot

### Logs Importantes

- Aplicación: `/var/log/pm2/`
- Nginx: `/var/log/nginx/`
- MySQL: `/var/log/mysql/`

## ✅ Verificación Final

1. ✅ Sitio accesible por HTTPS
2. ✅ Login funcionando
3. ✅ Base de datos conectada
4. ✅ Subida de imágenes funcionando
5. ✅ Todas las funcionalidades testeadas

## 🔒 Seguridad

- Cambiar todas las contraseñas por defecto
- Configurar fail2ban para SSH
- Mantener el sistema actualizado
- Backup regular de la base de datos
- Monitoreo de logs de seguridad