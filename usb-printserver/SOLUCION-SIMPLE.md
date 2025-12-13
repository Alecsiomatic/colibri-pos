# 🎯 INSTALACIÓN SÚPER SIMPLE (MÉTODO RECOMENDADO)

## ¿Qué pasó?

La instalación de Node.js se interrumpió y la red se cayó. **PERO** probablemente Node.js ya se instaló parcialmente.

## ✅ SOLUCIÓN MÁS SIMPLE:

### 🔌 PASO 1: Reiniciar la Raspberry Pi

**Opción A: Con monitor y teclado**
```
1. Conecta un monitor HDMI y un teclado USB a la Raspberry Pi
2. Verás una pantalla de login
3. Login: pi
4. Password: supernovaprint
5. Escribe: sudo reboot
```

**Opción B: Desconectar corriente**
```
1. Desconecta el cable de corriente de la Raspberry Pi
2. Espera 10 segundos
3. Vuelve a conectar la corriente
4. Espera 2 minutos para que arranque
```

---

### 🌐 PASO 2: Verificar que tiene red

Desde tu PC Windows (PowerShell):

```powershell
ping 192.168.100.98
```

**Si responde:**
```
Respuesta desde 192.168.100.98: bytes=32 tiempo=2ms TTL=64
```
✅ **¡TIENE RED! Continúa al Paso 3**

**Si NO responde:**
```
Tiempo de espera agotado para esta solicitud.
```
❌ Ve a **"SOLUCIÓN SIN RED"** más abajo

---

### 📦 PASO 3: Copiar archivos por SCP (con red)

Desde tu PC (PowerShell):

```powershell
# Ir a la carpeta
cd "C:\Users\Alecs\Desktop\ddu\manu soft"

# Copiar TODO por red
scp -r usb-printserver\server pi@192.168.100.98:~/
scp -r usb-printserver\config pi@192.168.100.98:~/
scp usb-printserver\start-server.sh pi@192.168.100.98:~/
```

Contraseña: `supernovaprint`

---

### 🚀 PASO 4: Conectar y ejecutar

```powershell
ssh pi@192.168.100.98
```

Una vez conectado:

```bash
# Verificar que Node.js ya está instalado
node --version

# Si responde algo como v20.x.x ✅ PERFECTO!
# Si dice "command not found" ❌ ve a "SOLUCIÓN SIN NODE"

# Dar permisos
chmod +x ~/start-server.sh

# Instalar dependencias (tomará 2-3 minutos)
cd ~/server
npm install

# Iniciar servidor
cd ~
./start-server.sh
```

---

## 🔍 VERIFICAR QUE FUNCIONA

```bash
# En otra terminal (desde tu PC)
curl http://192.168.100.98:3001/status
```

Si responde:
```json
{"status":"online","printer":{"ip":"192.168.100.101","port":9100}}
```

**✅ ¡FUNCIONA!**

---

## ❌ SOLUCIÓN SIN RED

Si después de reiniciar NO tiene red:

### Con monitor y teclado conectado:

```bash
# Login: pi / supernovaprint

# Ver estado de red
ip addr show eth0

# Si no muestra 192.168.100.98, reiniciar red:
sudo systemctl restart networking
sudo dhclient eth0

# Verificar otra vez
ip addr show eth0
```

### Si sigue sin red:

**Revisa el cable de red:**
- ¿Los LEDs del puerto RJ45 están encendidos?
- ¿El cable está bien conectado al router/switch?
- ¿Otros dispositivos en la red funcionan?

**Prueba con otra IP estática:**

```bash
# Editar configuración de red
sudo nano /etc/dhcpcd.conf

# Agregar al final:
interface eth0
static ip_address=192.168.100.99/24
static routers=192.168.100.1
static domain_name_servers=8.8.8.8

# Guardar: Ctrl+O, Enter, Ctrl+X
# Reiniciar
sudo reboot
```

Luego intenta con: `ssh pi@192.168.100.99`

---

## 🔧 SOLUCIÓN SIN NODE.JS

Si Node.js no está instalado (comando `node` no encontrado):

```bash
# Descargar Node.js manualmente (tomará 5 minutos)
cd ~
wget https://unofficial-builds.nodejs.org/download/release/v18.20.5/node-v18.20.5-linux-armv7l.tar.xz

# Extraer
tar -xf node-v18.20.5-linux-armv7l.tar.xz

# Crear enlace simbólico
sudo ln -s ~/node-v18.20.5-linux-armv7l/bin/node /usr/local/bin/node
sudo ln -s ~/node-v18.20.5-linux-armv7l/bin/npm /usr/local/bin/npm

# Verificar
node --version
npm --version
```

---

## 📊 DIAGNÓSTICO RÁPIDO

Si nada funciona, envíame la salida de estos comandos:

```bash
# Estado general
uptime
free -h

# Red
ip addr show
ping -c 3 8.8.8.8

# Node.js
which node
node --version || echo "Node no instalado"
npm --version || echo "npm no instalado"

# Espacio en disco
df -h

# Procesos
ps aux | grep node
```

---

## 🎯 MÉTODO ALTERNATIVO: Usar el Node.js del sistema

Si la instalación se completó (aunque sea parcialmente), el Node.js probablemente YA ESTÁ instalado.

Intenta simplemente:

```bash
ssh pi@192.168.100.98
cd ~/server
npm install
node index.js
```

¡Eso podría ser suficiente! 🚀
