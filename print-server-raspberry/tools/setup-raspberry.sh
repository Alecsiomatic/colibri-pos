#!/bin/bash

# ============================================
# SCRIPT DE INSTALACIÓN AUTOMÁTICA
# Servidor de Impresión Raspberry Pi
# ============================================

set -e  # Salir si hay error

echo ""
echo "========================================"
echo "🖨️  INSTALACIÓN SERVIDOR DE IMPRESIÓN"
echo "========================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_status() {
  echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
  echo -e "${RED}[✗]${NC} $1"
}

# ============================================
# 1. ACTUALIZAR SISTEMA
# ============================================
print_status "Actualizando sistema operativo..."
sudo apt update
sudo apt upgrade -y

# ============================================
# 2. INSTALAR NODE.JS 20
# ============================================
print_status "Instalando Node.js 20..."

# Verificar si Node.js ya está instalado
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  print_warning "Node.js ya instalado: $NODE_VERSION"
  read -p "¿Reinstalar? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
  fi
else
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

print_status "Node.js $(node -v) instalado"
print_status "npm $(npm -v) instalado"

# ============================================
# 3. INSTALAR PM2
# ============================================
print_status "Instalando PM2..."

if command -v pm2 &> /dev/null; then
  print_warning "PM2 ya instalado"
else
  sudo npm install -g pm2
fi

print_status "PM2 $(pm2 -v) instalado"

# ============================================
# 4. CONFIGURAR DIRECTORIO
# ============================================
print_status "Configurando directorio de trabajo..."

cd ~/server

# Crear directorio de logs
mkdir -p logs

# ============================================
# 5. INSTALAR DEPENDENCIAS
# ============================================
print_status "Instalando dependencias de Node.js..."
npm install --production

# ============================================
# 6. VERIFICAR CONFIGURACIÓN
# ============================================
print_status "Verificando configuración..."

# Verificar archivo de configuración
if [ -f "../config/printer-config.json" ]; then
  print_status "Archivo de configuración encontrado"
  cat ../config/printer-config.json
else
  print_error "Archivo de configuración no encontrado"
  exit 1
fi

# ============================================
# 7. PROBAR CONECTIVIDAD CON IMPRESORA
# ============================================
print_status "Probando conexión con impresora..."

PRINTER_IP=$(grep -o '"ip": "[^"]*' ../config/printer-config.json | sed 's/"ip": "//')
PRINTER_PORT=$(grep -o '"port": [0-9]*' ../config/printer-config.json | sed 's/"port": //')

echo "IP: $PRINTER_IP"
echo "Puerto: $PRINTER_PORT"

if nc -zv "$PRINTER_IP" "$PRINTER_PORT" 2>&1 | grep -q "succeeded"; then
  print_status "✅ Impresora accesible en $PRINTER_IP:$PRINTER_PORT"
else
  print_warning "⚠️  No se pudo conectar a la impresora"
  print_warning "Verifica que la impresora esté encendida y en la red"
  read -p "¿Continuar de todos modos? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# ============================================
# 8. CONFIGURAR VARIABLES DE ENTORNO
# ============================================
print_status "Configurando variables de entorno..."

export PRINTER_IP="$PRINTER_IP"
export PRINTER_PORT="$PRINTER_PORT"
export NODE_ENV="production"
export TZ="America/Mexico_City"

# ============================================
# 9. INICIAR SERVIDOR CON PM2
# ============================================
print_status "Iniciando servidor con PM2..."

# Detener proceso anterior si existe
pm2 stop print-server 2>/dev/null || true
pm2 delete print-server 2>/dev/null || true

# Iniciar servidor
pm2 start ecosystem.config.js

# Guardar configuración de PM2
pm2 save

# Configurar PM2 para arranque automático
print_status "Configurando arranque automático..."
pm2 startup | grep "sudo" | bash || true

# ============================================
# 10. VERIFICAR INSTALACIÓN
# ============================================
print_status "Verificando instalación..."

sleep 3

pm2 status

# ============================================
# 11. MOSTRAR LOGS
# ============================================
echo ""
echo "========================================"
echo "📋 LOGS DEL SERVIDOR:"
echo "========================================"
echo ""

pm2 logs print-server --lines 20 --nostream

# ============================================
# 12. PRUEBA DE IMPRESIÓN (OPCIONAL)
# ============================================
echo ""
read -p "¿Imprimir ticket de prueba? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  print_status "Enviando ticket de prueba..."
  sleep 2
  
  curl -X POST http://localhost:3001/print/test \
    -H "Content-Type: application/json" \
    --silent --show-error || print_warning "No se pudo imprimir (servidor iniciando...)"
fi

# ============================================
# FINALIZACIÓN
# ============================================
echo ""
echo "========================================"
echo "✅ INSTALACIÓN COMPLETADA"
echo "========================================"
echo ""
echo "📊 Estado: $(pm2 status | grep print-server | awk '{print $10}')"
echo "📡 Puerto: 3001"
echo "🖨️  Impresora: $PRINTER_IP:$PRINTER_PORT"
echo ""
echo "🔧 COMANDOS ÚTILES:"
echo "   pm2 logs print-server     # Ver logs"
echo "   pm2 restart print-server  # Reiniciar"
echo "   pm2 stop print-server     # Detener"
echo "   pm2 status                # Ver estado"
echo ""
echo "🌐 Prueba desde otro dispositivo:"
echo "   curl http://$(hostname -I | awk '{print $1}'):3001/status"
echo ""
echo "========================================"
echo ""

exit 0
