#!/bin/bash

# 🚀 Script de inicio del Print Server

INSTALL_DIR="$HOME/printserver"
cd "$INSTALL_DIR"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=================================================="
echo "🖨️  PRINT SERVER - SuperNova Burgers"
echo "=================================================="
echo ""

# Verificar si existe Node.js portable
if [ -f "$INSTALL_DIR/node-portable/bin/node" ]; then
    NODE_BIN="$INSTALL_DIR/node-portable/bin/node"
    echo -e "${GREEN}✅ Usando Node.js portable${NC}"
else
    NODE_BIN="node"
    echo -e "${YELLOW}⚠️  Usando Node.js del sistema${NC}"
fi

# Verificar que Node funciona
echo -e "${YELLOW}🔍 Verificando Node.js...${NC}"
$NODE_BIN --version
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Node.js no funciona${NC}"
    exit 1
fi

# Configurar variables de entorno
export PRINTER_IP="192.168.100.101"
export PRINTER_PORT="9100"
export SERVER_PORT="3001"
export NODE_ENV="production"

echo -e "${GREEN}✅ Node.js: $($NODE_BIN --version)${NC}"
echo ""
echo "📋 Configuración:"
echo "   Impresora: $PRINTER_IP:$PRINTER_PORT"
echo "   Puerto servidor: $SERVER_PORT"
echo ""
echo -e "${GREEN}🚀 Iniciando servidor...${NC}"
echo ""

# Iniciar servidor
cd "$INSTALL_DIR/server"
exec "$NODE_BIN" index.js
