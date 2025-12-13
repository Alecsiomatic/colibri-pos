# 📦 Instalación Completa del Print Server desde USB

## 🎯 Lo que contiene esta carpeta

Esta carpeta tiene **TODO** lo necesario para instalar el print server en la Raspberry Pi **sin necesidad de internet**.

```
usb-printserver/
├── node-portable/          # Node.js portable (sin instalación)
├── server/                 # Servidor de impresión completo
│   ├── node_modules/       # Todas las dependencias PRE-INSTALADAS
│   ├── index.js
│   ├── printer.js
│   └── package.json
├── config/
│   └── printer-config.json
├── install.sh              # Script de instalación automática
└── start-server.sh         # Script para iniciar el servidor

```

## 📋 PASOS DE INSTALACIÓN

### 1️⃣ Copiar TODO a la Raspberry Pi

```bash
# Desde tu PC (PowerShell)
# La USB está montada en la Raspberry Pi como /media/pi/...
# Necesitas copiar esta carpeta completa a la Raspberry Pi
```

### 2️⃣ Conectarte por SSH a la Raspberry Pi

```bash
ssh pi@192.168.100.98
# Password: supernovaprint
```

### 3️⃣ Ejecutar el instalador automático

```bash
# Ir a donde copiaste los archivos
cd ~/printserver-usb

# Dar permisos de ejecución
chmod +x install.sh start-server.sh

# Ejecutar instalador (esto tomará solo 1 minuto)
./install.sh
```

### 4️⃣ Iniciar el servidor

```bash
# Opción A: Ejecutar directamente
./start-server.sh

# Opción B: Con PM2 (si está instalado)
pm2 start server/index.js --name print-server

# Opción C: En segundo plano
nohup ./start-server.sh > server.log 2>&1 &
```

## 🔧 Si la Raspberry Pi no responde

### Opción 1: Copiar directo a la USB (sin SSH)

1. **Apaga la Raspberry Pi**
2. **Saca la USB Kingston** de la Raspberry Pi
3. **Conecta la USB a tu PC con Windows**
4. **Copia esta carpeta** `usb-printserver` a: `/home/pi/`
5. **Reinserta la USB** en la Raspberry Pi
6. **Enciende** la Raspberry Pi
7. **Continúa desde el paso 2** (SSH)

### Opción 2: Instalar Node.js manualmente (método simple)

Si todo falla, usaremos Node.js portable que no requiere instalación del sistema.

## ✅ Verificación

```bash
# Verificar que Node.js funciona
./node-portable/bin/node --version

# Verificar que el servidor inicia
curl http://localhost:3001/status

# Ver logs
tail -f server.log
```

## 🚨 Solución de problemas

### La Raspberry Pi no tiene red
```bash
# Verificar IP
ip addr show

# Reiniciar red
sudo systemctl restart networking

# Ver estado de red
sudo systemctl status networking
```

### El servidor no inicia
```bash
# Ver errores
./node-portable/bin/node server/index.js

# Verificar puerto ocupado
sudo netstat -tulpn | grep 3001
```

### La impresora no responde
```bash
# Probar conexión TCP
nc -zv 192.168.100.101 9100

# Ping a la impresora
ping 192.168.100.101
```

## 📞 Siguiente paso

Una vez funcionando, actualiza tu app de React para apuntar a:
```
http://192.168.100.98:3001
```
