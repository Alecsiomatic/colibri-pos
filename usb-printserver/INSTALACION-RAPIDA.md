# 🚀 INSTALACIÓN RÁPIDA - 3 PASOS

## ⚡ OPCIÓN 1: Copiar por USB (SIN NECESIDAD DE RED)

### 📋 Qué necesitas:
- USB Kingston 16GB (la que tiene Raspberry Pi OS)
- Lector de USB en tu PC Windows

### 🔧 PASOS:

**1️⃣ Apagar la Raspberry Pi**
```
Desconecta la corriente de la Raspberry Pi
```

**2️⃣ Sacar la USB y conectarla a tu PC**
```
- Saca la USB Kingston de la Raspberry Pi
- Conéctala a tu PC Windows
- Windows debería mostrar 2 particiones:
  * boot (pequeña)
  * rootfs (grande, con Linux ext4)
```

**3️⃣ Instalar software para leer ext4 en Windows**

Descarga e instala **Linux File Systems for Windows** (gratuito):
https://www.paragon-software.com/free/linuxfs-windows/

O usa **WSL** si ya lo tienes instalado.

**4️⃣ Copiar la carpeta completa**

Desde **esta carpeta** (`usb-printserver`), copia TODO a:
```
/home/pi/printserver-usb/
```

**5️⃣ Reconectar la USB a la Raspberry Pi**
```
- Expulsa la USB de forma segura en Windows
- Reconecta la USB a la Raspberry Pi
- Conecta la corriente (enciende)
```

**6️⃣ Espera 2 minutos y conecta por SSH**
```powershell
ssh pi@192.168.100.98
# Password: supernovaprint
```

**7️⃣ Ejecutar instalador**
```bash
cd ~/printserver-usb
chmod +x install.sh start-server.sh
./install.sh
cd ~/printserver
./start-server.sh
```

---

## ⚡ OPCIÓN 2: Copiar por SCP (CUANDO VUELVA LA RED)

Si la Raspberry Pi vuelve a tener red:

**1️⃣ Desde tu PC (PowerShell):**
```powershell
# Ir a la carpeta que contiene usb-printserver
cd "C:\Users\Alecs\Desktop\ddu\manu soft"

# Copiar TODO por SCP
scp -r usb-printserver pi@192.168.100.98:~/printserver-usb
```

**2️⃣ Conectar por SSH:**
```powershell
ssh pi@192.168.100.98
```

**3️⃣ Instalar:**
```bash
cd ~/printserver-usb
chmod +x install.sh start-server.sh
./install.sh
cd ~/printserver
./start-server.sh
```

---

## 🔍 VERIFICAR QUE FUNCIONA

```bash
# Ver que el servidor está corriendo
curl http://localhost:3001/status

# Ver IP de la Raspberry Pi
hostname -I

# Probar desde tu PC (reemplaza con la IP correcta)
curl http://192.168.100.98:3001/status
```

Si responde algo como:
```json
{"status":"online","printer":{"ip":"192.168.100.101","port":9100}}
```

**¡FUNCIONA! ✅**

---

## 🚨 SOLUCIÓN RÁPIDA: Reiniciar red de Raspberry Pi

Si la Raspberry Pi no tiene red después de encenderla:

```bash
# Conecta un monitor y teclado a la Raspberry Pi
# Login: pi / supernovaprint

# Reiniciar red
sudo systemctl restart networking

# Ver IP
ip addr show eth0

# Debería mostrar: 192.168.100.98
```

---

## 📞 Siguiente paso

Una vez funcionando, actualiza tu componente React:

```typescript
// En KitchenPrint.tsx
const PRINT_SERVER_URL = 'http://192.168.100.98:3001';
```
