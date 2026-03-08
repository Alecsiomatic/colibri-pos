#!/bin/bash

# Script de despliegue rápido para VPS
# Ejecutar con: bash deploy.sh

echo "🚀 Iniciando despliegue del sistema de restaurante..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar errores
error() {
    echo -e "${RED}❌ Error: $1${NC}"
    exit 1
}

# Función para mostrar éxito
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Función para mostrar advertencias
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Ejecuta este script desde el directorio del proyecto."
fi

# Verificar que existe el archivo .env.local
if [ ! -f ".env.local" ]; then
    warning "No se encontró .env.local. Copiando desde .env.production..."
    if [ -f ".env.production" ]; then
        cp .env.production .env.local
        warning "Edita .env.local con los valores correctos antes de continuar."
        echo "Presiona ENTER para continuar después de editar .env.local..."
        read
    else
        error "No se encontró .env.production. Crea las variables de entorno necesarias."
    fi
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
if command -v pnpm &> /dev/null; then
    pnpm install || error "Error instalando dependencias con pnpm"
else
    npm install || error "Error instalando dependencias con npm"
fi

# Build del proyecto
echo "🏗️  Construyendo proyecto para producción..."
if command -v pnpm &> /dev/null; then
    pnpm build || error "Error en el build"
else
    npm run build || error "Error en el build"
fi

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2 || error "Error instalando PM2"
fi

# Crear directorios necesarios
echo "📁 Creando directorios..."
sudo mkdir -p /var/www/uploads
sudo mkdir -p /var/log/pm2
sudo chown -R www-data:www-data /var/www/uploads
sudo chmod 755 /var/www/uploads

# Detener aplicación si está corriendo
echo "🔄 Deteniendo aplicación anterior..."
pm2 delete restaurante 2>/dev/null || true

# Iniciar aplicación con PM2
echo "🚀 Iniciando aplicación..."
pm2 start ecosystem.config.js || error "Error iniciando la aplicación"

# Guardar configuración PM2
pm2 save
pm2 startup

success "Aplicación desplegada exitosamente!"
echo ""
echo "📊 Estado de la aplicación:"
pm2 status restaurante

echo ""
echo "📝 Comandos útiles:"
echo "   pm2 logs restaurante    - Ver logs"
echo "   pm2 restart restaurante - Reiniciar"
echo "   pm2 stop restaurante    - Detener"
echo "   pm2 monit              - Monitor en tiempo real"

echo ""
echo "🌐 Para completar la configuración:"
echo "   1. Configura Nginx con el archivo de configuración"
echo "   2. Configura SSL con Let's Encrypt"
echo "   3. Importa la estructura de base de datos"
echo "   4. Crea el usuario admin inicial"

echo ""
warning "Recuerda cambiar las contraseñas por defecto en producción!"