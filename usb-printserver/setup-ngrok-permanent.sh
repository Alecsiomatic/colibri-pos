#!/bin/bash

# Script para configurar ngrok permanente en Raspberry Pi
# Ejecutar en la Raspberry Pi

echo "=== Configurando ngrok permanente ==="

# 1. Configurar authtoken (reemplaza TU_AUTHTOKEN_AQUI)
echo "Configurando authtoken..."
./ngrok config add-authtoken TU_AUTHTOKEN_AQUI

# 2. Crear archivo de configuración ngrok
echo "Creando configuración..."
cat > ~/.config/ngrok/ngrok.yml << 'EOF'
version: 2
authtoken: TU_AUTHTOKEN_AQUI
tunnels:
  print-server:
    proto: http
    addr: 3001
    bind_tls: true
    inspect: false
EOF

# 3. Crear script de inicio automático
cat > ~/start-ngrok-permanent.sh << 'EOF'
#!/bin/bash
cd ~/usb-printserver
echo "Iniciando servidor de impresión..."
nohup node index.js > server.log 2>&1 &
echo "Servidor iniciado con PID: $!"

echo "Iniciando túnel ngrok..."
nohup ./ngrok start print-server > ngrok.log 2>&1 &
echo "Ngrok iniciado con PID: $!"

echo "=== SISTEMA INICIADO ==="
echo "Ver logs del servidor: tail -f ~/usb-printserver/server.log"
echo "Ver logs de ngrok: tail -f ~/usb-printserver/ngrok.log"
echo "Ver túnel activo: curl http://localhost:4040/api/tunnels"
EOF

chmod +x ~/start-ngrok-permanent.sh

echo "=== Configuración completada ==="
echo ""
echo "PASOS SIGUIENTES:"
echo "1. Reemplaza 'TU_AUTHTOKEN_AQUI' con tu authtoken real"
echo "2. Ejecuta: ./start-ngrok-permanent.sh"
echo "3. Obtén la URL fija con: curl http://localhost:4040/api/tunnels"