# 🔧 GUÍA DE SOLUCIÓN DE PROBLEMAS

## ❌ No encuentro la IP de la Raspberry Pi

### Método 1: Desde Windows
```powershell
# Ping por hostname
ping printserver.local

# Escanear red (requiere nmap)
nmap -sn 192.168.100.0/24

# Ver tabla ARP
arp -a | findstr "b8-27-eb"
arp -a | findstr "dc-a6-32"
```

### Método 2: Conectar monitor
1. Conecta monitor HDMI a la Raspberry Pi
2. Conecta teclado USB
3. Login: `pi` / `supernovaprint`
4. Ejecuta: `hostname -I`

### Método 3: Desde el router
1. Accede a tu router (192.168.100.1 o 192.168.0.1)
2. Busca dispositivos conectados
3. Busca "printserver" o "raspberrypi"

---

## ❌ No puedo conectarme por SSH

### Error: "Connection refused"
```bash
# Verifica que SSH esté habilitado
# En la Raspberry Pi (con monitor):
sudo systemctl status ssh
sudo systemctl enable ssh
sudo systemctl start ssh
```

### Error: "Connection timeout"
1. Verifica que la Pi esté encendida (LED rojo)
2. Verifica que esté en la misma red
3. Prueba con cable ethernet directo

### Error: "Permission denied"
- Usuario correcto: `pi`
- Password: `supernovaprint` (o el que configuraste)

---

## ❌ La impresora no se conecta

### Verificar red
```bash
# Ping a la impresora
ping 192.168.100.101

# Si no responde:
# 1. Verifica que la impresora esté encendida
# 2. Verifica el cable ethernet
# 3. Verifica la IP en el panel de la impresora
```

### Probar conexión TCP
```bash
# Instalar netcat si no está
sudo apt install netcat

# Probar puerto 9100
nc -zv 192.168.100.101 9100

# Enviar comando de prueba
echo -e "\x1B\x40Prueba de conexion\n\n\n" | nc 192.168.100.101 9100
```

### Cambiar IP de impresora
Si tu impresora tiene otra IP, edita:
```bash
nano ~/config/printer-config.json

# Cambia:
"ip": "TU_IP_AQUI"

# Reinicia:
pm2 restart print-server
```

---

## ❌ El servidor no inicia

### Ver logs completos
```bash
pm2 logs print-server --lines 100

# Ver errores específicos
pm2 logs print-server --err
```

### Errores comunes

#### "Cannot find module 'express'"
```bash
cd ~/server
npm install
pm2 restart print-server
```

#### "Port 3001 already in use"
```bash
# Encontrar proceso usando el puerto
sudo lsof -i :3001

# Matar proceso
sudo kill -9 [PID]

# O cambiar puerto
nano ecosystem.config.js
# Cambia PORT: 3002
```

#### "ECONNREFUSED"
- La impresora está apagada o no accesible
- Verifica con `ping 192.168.100.101`

---

## ❌ La Raspberry Pi no arranca desde USB

### Para Raspberry Pi 3
Necesita bootloader en microSD primero:
1. Crea una microSD con Raspberry Pi OS
2. Arranca con la microSD
3. Ejecuta: `sudo raspi-config`
4. Advanced Options → Boot Order → USB Boot
5. Reboot
6. Ahora puedes usar el USB

### Para Raspberry Pi 4/5
1. Actualiza firmware (si es vieja):
```bash
sudo apt update
sudo apt full-upgrade
sudo rpi-eeprom-update
```

2. Si el USB no bootea:
- Prueba otro puerto USB (USB 3.0 azul)
- Verifica que el USB sea booteable
- Flashea nuevamente con Raspberry Pi Imager

---

## ❌ Errores al instalar dependencias

### Error: "gyp ERR!"
```bash
# Instalar herramientas de compilación
sudo apt install -y build-essential python3

# Limpiar e instalar
cd ~/server
rm -rf node_modules
npm install
```

### Error: "EACCES permissions"
```bash
# No usar sudo para npm install
# Si ya lo hiciste:
sudo chown -R $USER:$USER ~/server
cd ~/server
npm install
```

---

## ❌ La impresión sale cortada o mal

### Verificar ancho de papel
```bash
# En printer.js, verifica:
.font('a')  # Fuente pequeña
.align('lt')  # Alineación izquierda
```

### Caracteres raros
```bash
# Cambiar encoding
nano ~/server/printer.js

# Línea: 
const printer = new escpos.Printer(device, { encoding: 'utf8' });

# Prueba: 'cp850', 'iso88591'
```

---

## ❌ PM2 no arranca automáticamente

```bash
# Verificar startup
pm2 startup

# Ejecutar el comando que muestra (con sudo)

# Guardar lista de procesos
pm2 save

# Verificar
sudo systemctl status pm2-pi
```

---

## ❌ Resetear todo

### Resetear PM2
```bash
pm2 kill
pm2 start ecosystem.config.js
pm2 save
```

### Reinstalar servidor
```bash
cd ~
rm -rf server
# Copiar archivos nuevamente
scp -r /ruta/a/server pi@192.168.100.50:~/
cd ~/server
npm install
pm2 start ecosystem.config.js
```

### Formatear USB y empezar de nuevo
1. Abre Raspberry Pi Imager
2. Selecciona el USB
3. Click en "Choose OS" → "Erase"
4. Sigue la guía desde el PASO 1

---

## 🆘 Ayuda adicional

### Obtener información del sistema
```bash
# Información de la Pi
cat /proc/cpuinfo
vcgencmd get_throttled

# Temperatura
vcgencmd measure_temp

# Memoria
free -h

# Disco
df -h

# Red
ifconfig
ip addr show
```

### Exportar logs
```bash
# Guardar logs para diagnóstico
pm2 logs print-server --lines 500 > ~/debug.log

# Copiar a tu computadora
scp pi@192.168.100.50:~/debug.log .
```

---

## 📞 CONTACTO

Si nada funciona:
1. Exporta los logs: `pm2 logs print-server --lines 200`
2. Anota el modelo de tu Raspberry Pi
3. Anota los pasos que hiciste
4. Comparte la info

**¡No te rindas! Todo tiene solución.** 🚀
