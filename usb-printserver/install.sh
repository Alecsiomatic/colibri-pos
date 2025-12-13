#!/bin/bash

# 🚀 Instalador Automático del Print Server
# No requiere internet - todo está incluido

echo "=================================================="
echo "🖨️  INSTALADOR PRINT SERVER - SuperNova Burgers"
echo "=================================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directorio de instalación
INSTALL_DIR="$HOME/printserver"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${YELLOW}📁 Directorio de script: $SCRIPT_DIR${NC}"
echo -e "${YELLOW}📁 Directorio de instalación: $INSTALL_DIR${NC}"
echo ""

# Paso 1: Crear directorio de instalación
echo -e "${GREEN}[1/5]${NC} Creando directorio de instalación..."
mkdir -p "$INSTALL_DIR"

# Paso 2: Copiar Node.js portable
echo -e "${GREEN}[2/5]${NC} Instalando Node.js portable..."
if [ -d "$SCRIPT_DIR/node-portable" ]; then
    cp -r "$SCRIPT_DIR/node-portable" "$INSTALL_DIR/"
    echo "✅ Node.js portable copiado"
else
    echo -e "${YELLOW}⚠️  Node.js portable no encontrado, se usará el del sistema${NC}"
fi

# Paso 3: Copiar servidor con dependencias
echo -e "${GREEN}[3/5]${NC} Instalando servidor de impresión..."
cp -r "$SCRIPT_DIR/server" "$INSTALL_DIR/"
echo "✅ Servidor copiado"

# Paso 4: Copiar configuración
echo -e "${GREEN}[4/5]${NC} Instalando configuración..."
mkdir -p "$INSTALL_DIR/config"
cp -r "$SCRIPT_DIR/config/"* "$INSTALL_DIR/config/"
echo "✅ Configuración copiada"

# Paso 5: Copiar scripts de inicio
echo -e "${GREEN}[5/5]${NC} Instalando scripts de inicio..."
cp "$SCRIPT_DIR/start-server.sh" "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/start-server.sh"
echo "✅ Scripts instalados"

echo ""
echo "=================================================="
echo -e "${GREEN}✅ INSTALACIÓN COMPLETA${NC}"
echo "=================================================="
echo ""
echo "📝 Siguiente paso:"
echo ""
echo "   cd $INSTALL_DIR"
echo "   ./start-server.sh"
echo ""
echo "O para ejecutar en segundo plano:"
echo ""
echo "   nohup $INSTALL_DIR/start-server.sh > $INSTALL_DIR/server.log 2>&1 &"
echo ""
echo "=================================================="
