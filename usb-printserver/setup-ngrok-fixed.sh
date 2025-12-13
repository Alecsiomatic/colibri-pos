#!/bin/bash

# ====================================================
# CONFIGURACIÓN NGROK PERMANENTE - SUPERNOVA BURGERS
# ====================================================

echo "🚀 Configurando ngrok permanente..."

# PASO 1: Configurar authtoken (REEMPLAZA CON TU TOKEN REAL)
echo "📝 Configurando authtoken..."
./ngrok config add-authtoken 34wnf7hkjzpZhFZofMPpT36ns7S_23sLY6DB8v2yXYneReDjC

# PASO 2: Crear configuración permanente
echo "⚙️ Creando configuración ngrok..."
mkdir -p ~/.config/ngrok
cat > ~/.config/ngrok/ngrok.yml << 'EOF'
version: 2
authtoken: 34wnf7hkjzpZhFZofMPpT36ns7S_23sLY6DB8v2yXYneReDjC
tunnels:
  print-server:
    proto: http
    addr: 3001
    # Tu dominio fijo de ngrok
    hostname: supernovaprint.ngrok.app
    inspect: false
EOF

# PASO 3: Script de inicio automático
echo "🔧 Creando script de inicio..."
cat > ~/start-supernova-print.sh << 'EOF'
#!/bin/bash
cd ~/usb-printserver

echo "🖨️ Iniciando servidor de impresión SuperNova..."
nohup node index.js > server.log 2>&1 &
SERVER_PID=$!
echo "✅ Servidor iniciado con PID: $SERVER_PID"

echo "🌐 Iniciando túnel ngrok permanente..."
nohup ./ngrok start print-server > ngrok.log 2>&1 &
NGROK_PID=$!
echo "✅ Ngrok iniciado con PID: $NGROK_PID"

echo ""
echo "🎉 SISTEMA SUPERNOVA PRINT INICIADO"
echo "======================================="
echo "📊 Ver logs servidor: tail -f ~/usb-printserver/server.log"
echo "📊 Ver logs ngrok: tail -f ~/usb-printserver/ngrok.log"
echo "🔍 Ver túnel activo: curl http://localhost:4040/api/tunnels"
echo "🌐 Tu URL fija: https://supernovaprint.ngrok.app"
echo ""
EOF

chmod +x ~/start-supernova-print.sh

# PASO 4: Script para verificar estado
cat > ~/check-print-status.sh << 'EOF'
#!/bin/bash
echo "🔍 ESTADO DEL SISTEMA SUPERNOVA PRINT"
echo "===================================="

# Verificar servidor
if pgrep -f "node index.js" > /dev/null; then
    echo "✅ Servidor de impresión: CORRIENDO"
else
    echo "❌ Servidor de impresión: PARADO"
fi

# Verificar ngrok
if pgrep -f "./ngrok" > /dev/null; then
    echo "✅ Túnel ngrok: CORRIENDO"
    echo "🌐 URL activa:"
    curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1
else
    echo "❌ Túnel ngrok: PARADO"
fi

echo ""
echo "📊 Uso de memoria:"
ps aux | grep -E "(node|ngrok)" | grep -v grep
EOF

chmod +x ~/check-print-status.sh

echo ""
echo "✅ CONFIGURACIÓN COMPLETADA"
echo "=========================="
echo ""
echo "🔄 PASOS SIGUIENTES:"
echo "1. Ve al dashboard de ngrok y crea tu Cloud Endpoint"
echo "2. Reemplaza 'TU_AUTHTOKEN_AQUI' con tu token real"
echo "3. Reemplaza 'TU_DOMINIO_FIJO.ngrok.app' con tu dominio"
echo "4. Ejecuta: ./start-supernova-print.sh"
echo "5. Verifica con: ./check-print-status.sh"
echo ""
echo "🎯 Tu URL será FIJA y nunca cambiará!"