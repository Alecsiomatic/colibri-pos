# 📋 COPIAR ARCHIVOS DESPUÉS DEL FLASH

## ⚠️ IMPORTANTE: Hacer esto ANTES de expulsar la USB

Después de flashear con Raspberry Pi Imager:

### 1️⃣ La USB tendrá la letra D: (bootfs)

### 2️⃣ Ejecuta en PowerShell:

```powershell
# Copiar el servidor a la partición boot
xcopy /E /I /Y "C:\Users\Alecs\Desktop\ddu\manu soft\usb-printserver" "D:\printserver-usb"
```

### 3️⃣ Ahora SÍ expulsa la USB de forma segura

### 4️⃣ Conecta la USB a la Raspberry Pi

### 5️⃣ Enciende la Raspberry Pi

### 6️⃣ Espera 3 minutos (primer arranque es más lento)

### 7️⃣ Conecta por SSH:

```powershell
ssh pi@192.168.100.98
# Password: supernovaprint
```

### 8️⃣ Una vez conectado, ejecuta:

```bash
# Mover archivos de /boot a /home/pi/
sudo cp -r /boot/firmware/printserver-usb ~/
# O si está en otra ubicación:
sudo cp -r /boot/printserver-usb ~/

# Ir al directorio
cd ~/printserver-usb

# Verificar que Node.js está instalado
node --version

# Si NO está instalado, instalar:
sudo apt update
sudo apt install -y nodejs npm

# Instalar dependencias del servidor
cd ~/printserver-usb/server
npm install

# Dar permisos a scripts
cd ~/printserver-usb
chmod +x install.sh start-server.sh

# Ejecutar instalador
./install.sh

# Iniciar servidor
cd ~/printserver
./start-server.sh
```

## ✅ Verificar que funciona

Desde tu PC:
```powershell
curl http://192.168.100.98:3001/status
```

¡Listo! 🚀
