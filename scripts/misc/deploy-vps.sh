#!/bin/bash

# Script de deployment automático para VPS
# Dominio: https://supernovaburguers.shop/
# VPS: 72.60.168.4

set -e

echo "🚀 DEPLOYMENT - Supernova Burgers"
echo "=================================="
echo ""

# Variables
VPS_IP="72.60.168.4"
VPS_USER="root"
DOMAIN="supernovaburguers.shop"
APP_DIR="/var/www/restaurante"
REPO_URL="https://github.com/alecsiomatiko/restaurante.git"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

error() {
    echo -e "${RED}❌ Error: $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar conexión SSH
info "Verificando conexión al VPS..."
if ! ssh -o ConnectTimeout=5 $VPS_USER@$VPS_IP "echo 'Conexión exitosa'" > /dev/null 2>&1; then
    error "No se pudo conectar al VPS. Verifica las credenciales SSH."
fi
success "Conexión SSH establecida"

# Deployment en el VPS
info "Ejecutando deployment en el VPS..."

ssh $VPS_USER@$VPS_IP bash << 'ENDSSH'
set -e

# Colores para el servidor
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📦 Paso 1: Instalando dependencias del sistema...${NC}"

# Actualizar sistema
apt-get update -qq

# Instalar dependencias necesarias
apt-get install -y -qq nginx nodejs npm git curl certbot python3-certbot-nginx > /dev/null 2>&1 || echo "Algunas dependencias ya están instaladas"

# Instalar Node.js 20.x si no está instalado
if ! node --version | grep -q "v20"; then
    echo -e "${YELLOW}Instalando Node.js 20.x...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y nodejs > /dev/null 2>&1
fi

# Instalar pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}Instalando pnpm...${NC}"
    npm install -g pnpm > /dev/null 2>&1
fi

# Instalar PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Instalando PM2...${NC}"
    npm install -g pm2 > /dev/null 2>&1
fi

echo -e "${GREEN}✅ Dependencias instaladas${NC}"

echo -e "${BLUE}📁 Paso 2: Preparando directorios...${NC}"

# Crear directorios
mkdir -p /var/www/restaurante
mkdir -p /var/www/uploads
mkdir -p /var/log/pm2

# Permisos
chown -R www-data:www-data /var/www/uploads
chmod 755 /var/www/uploads

echo -e "${GREEN}✅ Directorios preparados${NC}"

echo -e "${BLUE}🔧 Paso 3: Configurando aplicación...${NC}"

cd /var/www/restaurante

# Si existe .git, hacer pull, sino clonar
if [ -d ".git" ]; then
    echo "Actualizando código existente..."
    git fetch --all
    git reset --hard origin/main
    git pull origin main
else
    echo "Clonando repositorio..."
    cd /var/www
    rm -rf restaurante
    git clone https://github.com/alecsiomatiko/restaurante.git
    cd restaurante
fi

echo -e "${GREEN}✅ Código actualizado${NC}"

echo -e "${BLUE}📦 Paso 4: Instalando dependencias de Node.js...${NC}"

# Limpiar cache y node_modules
rm -rf node_modules .next

# Instalar dependencias
pnpm install --prod=false

echo -e "${GREEN}✅ Dependencias instaladas${NC}"

echo -e "${BLUE}🏗️  Paso 5: Construyendo aplicación...${NC}"

# Build de producción
pnpm run build

echo -e "${GREEN}✅ Build completado${NC}"

echo -e "${BLUE}🔄 Paso 6: Reiniciando aplicación...${NC}"

# Detener aplicación anterior
pm2 delete restaurante 2>/dev/null || true

# Iniciar con PM2
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

# Auto-startup
pm2 startup systemd -u root --hp /root

echo -e "${GREEN}✅ Aplicación iniciada${NC}"

echo -e "${BLUE}🌐 Paso 7: Configurando Nginx...${NC}"

# Configurar Nginx
cat > /etc/nginx/sites-available/restaurante << 'EOF'
server {
    server_name supernovaburguers.shop www.supernovaburguers.shop;

    # Limitar tamaño de uploads
    client_max_body_size 10M;

    # Servir archivos estáticos
    location /uploads/ {
        alias /var/www/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        access_log off;
    }

    # Archivos estáticos de Next.js
    location /_next/static/ {
        alias /var/www/restaurante/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Proxy a la aplicación
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }

    listen 80;
}
EOF

# Habilitar sitio
ln -sf /etc/nginx/sites-available/restaurante /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test configuración
nginx -t

# Recargar Nginx
systemctl reload nginx

echo -e "${GREEN}✅ Nginx configurado${NC}"

echo -e "${BLUE}🔒 Paso 8: Configurando SSL...${NC}"

# Configurar SSL con Certbot (solo si no existe)
if [ ! -d "/etc/letsencrypt/live/supernovaburguers.shop" ]; then
    echo -e "${YELLOW}Obteniendo certificado SSL...${NC}"
    certbot --nginx -d supernovaburguers.shop -d www.supernovaburguers.shop --non-interactive --agree-tos --email admin@supernovaburguers.shop
    echo -e "${GREEN}✅ SSL configurado${NC}"
else
    echo -e "${GREEN}✅ SSL ya configurado${NC}"
fi

# Renovación automática
systemctl enable certbot.timer

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETADO EXITOSAMENTE! 🎉${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Estado de la aplicación:${NC}"
pm2 status

echo ""
echo -e "${BLUE}🌐 Tu aplicación está disponible en:${NC}"
echo -e "   ${GREEN}https://supernovaburguers.shop${NC}"
echo ""
echo -e "${BLUE}📝 Comandos útiles:${NC}"
echo "   pm2 logs restaurante    - Ver logs en tiempo real"
echo "   pm2 restart restaurante - Reiniciar aplicación"
echo "   pm2 stop restaurante    - Detener aplicación"
echo "   pm2 monit              - Monitor en tiempo real"
echo "   nginx -t               - Verificar config de Nginx"
echo "   systemctl status nginx - Estado de Nginx"
echo ""
echo -e "${YELLOW}⚠️  Recordatorios:${NC}"
echo "   1. Verifica las variables de entorno en .env.local"
echo "   2. Importa la base de datos si es necesario"
echo "   3. Crea el usuario admin inicial"
echo "   4. Cambia las contraseñas por defecto"
echo ""

ENDSSH

success "Deployment completado!"
echo ""
info "Verifica tu aplicación en: https://supernovaburguers.shop"
echo ""
