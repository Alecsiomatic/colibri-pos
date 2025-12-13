# 🖨️ **Servidor de Impresión Raspberry Pi - SuperNova Burgers**

## 📦 **¿Qué es esto?**
Sistema completo para convertir tu Raspberry Pi en un servidor de impresión que se comunica directamente con tu impresora térmica **80-VIII** vía red ethernet.

---

## 🛠️ **Hardware necesario:**
- ✅ **Raspberry Pi** (3, 4, o 5) - cualquiera funciona
- ✅ **USB Kingston 16GB** (el que tienes)
- ✅ **Cable RJ45** (ethernet)
- ✅ **Impresora térmica 80-VIII** (192.168.100.101:9100)
- ✅ **Cable de corriente** para la Raspberry Pi
- ✅ **Computadora con Windows** (para preparar el USB)

---

## 🚀 **INSTALACIÓN RÁPIDA (3 pasos):**

### **PASO 1: Preparar USB en Windows**

1. **Descarga Raspberry Pi Imager:**
   - Ve a: https://www.raspberrypi.com/software/
   - Descarga e instala **Raspberry Pi Imager**

2. **Flashea el USB:**
   - Conecta tu **USB Kingston de 16GB**
   - Abre **Raspberry Pi Imager**
   - **DEVICE:** Selecciona tu modelo de Raspberry Pi (ej: Raspberry Pi 4)
   - **OS:** `Raspberry Pi OS (64-bit) Lite` (SIN escritorio)
   - **STORAGE:** Selecciona tu USB Kingston

3. **Configuración (MUY IMPORTANTE):**
   - Click en ⚙️ **"Edit Settings"**
   - **Hostname:** `printserver` (o el que quieras)
   - ✅ **Enable SSH** → Use password authentication
   - **Username:** `pi`
   - **Password:** `supernovaprint` (cámbialo si quieres)
   - **Configure WiFi (opcional):**
     - SSID: nombre de tu red WiFi
     - Password: contraseña WiFi
     - Country: `MX`
   - ✅ **Set locale settings:**
     - Time zone: `America/Mexico_City`
     - Keyboard layout: `us`

4. **Escribir imagen:**
   - Click **"YES"** para borrar el USB
   - Espera 5-10 minutos
   - Cuando termine, **NO quites el USB aún**

5. **Copiar archivos del servidor:**
   - El USB ahora tiene una partición llamada **"bootfs"**
   - Copia la carpeta `server/` completa a una ubicación temporal
   - Necesitaremos estos archivos después

---

### **PASO 2: Primera vez encendiendo la Raspberry Pi**

1. **Conectar:**
   - Inserta el **USB Kingston** en la Raspberry Pi
   - Conecta el **cable ethernet** (RJ45) a tu red local
   - Conecta la **corriente** (la Pi arrancará automáticamente)

2. **Espera 2-3 minutos** (primera vez siempre tarda)

3. **Encuentra la IP de tu Raspberry Pi:**
   - **Opción A (recomendada):** Entra al router y busca el dispositivo `printserver`
   - **Opción B:** Usa tu computadora Windows:
     ```powershell
     ping printserver.local
     ```
   - Anota la IP (ejemplo: `192.168.100.50`)

4. **Conéctate por SSH:**
   ```powershell
   ssh pi@192.168.100.50
   ```
   - Password: `supernovaprint` (o el que pusiste)
   - Si pregunta "Are you sure?", escribe `yes`

---

### **PASO 3: Instalar el servidor de impresión**

**Opción A - Instalación Automática (RECOMENDADA):**

```bash
# Copiar archivos desde tu computadora a la Raspberry Pi
# En tu computadora Windows (PowerShell):
scp -r c:\Users\Alecs\Desktop\ddu\manu soft\print-server-raspberry\server pi@192.168.100.50:~/

# Luego, en la Raspberry Pi (SSH):
cd ~/server
chmod +x ../tools/setup-raspberry.sh
../tools/setup-raspberry.sh
```

**Opción B - Instalación Manual:**

```bash
# 1. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Instalar PM2
sudo npm install -g pm2

# 4. Copiar archivos del servidor (si no lo hiciste)
# Usa FileZilla o WinSCP para copiar la carpeta "server" a /home/pi/server

# 5. Instalar dependencias
cd ~/server
npm install

# 6. Configurar impresora (edita si tu IP es diferente)
nano ../config/printer-config.json
# Verifica que la IP sea: 192.168.100.101

# 7. Iniciar servidor
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# Copia el comando que muestra y ejecútalo con sudo

# 8. Verificar
pm2 status
pm2 logs print-server
```

---

## ✅ **VERIFICACIÓN:**

### **Probar servidor desde tu computadora:**

```powershell
# Reemplaza 192.168.100.50 con la IP de tu Raspberry Pi
curl http://192.168.100.50:3001/status
```

**Respuesta esperada:**
```json
{
  "status": "online",
  "printer": "192.168.100.101:9100",
  "connected": true
}
```

### **Probar impresión de prueba:**

```powershell
curl -X POST http://192.168.100.50:3001/print/test
```

**Si funciona:** Tu impresora debe imprimir un ticket de prueba ✅

---

## 🔧 **CONFIGURACIÓN FINAL EN TU APP:**

### **Actualizar KitchenPrint.tsx:**

Edita: `app/admin/orders/components/KitchenPrint.tsx`

Busca donde dice:
```typescript
const handlePrint = () => {
  window.print();
};
```

Reemplaza con:
```typescript
const PRINT_SERVER = 'http://192.168.100.50:3001'; // IP de tu Raspberry Pi

const handlePrint = async () => {
  try {
    // Intentar imprimir vía servidor Raspberry Pi
    const response = await fetch(`${PRINT_SERVER}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order',
        order: order,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      toast.success('¡Impreso en cocina! 🖨️');
      return;
    }
  } catch (error) {
    console.warn('Print server offline, usando window.print():', error);
  }

  // Fallback: impresión tradicional
  window.print();
};
```

---

## 📊 **COMANDOS ÚTILES:**

### **Monitorear el servidor:**
```bash
pm2 logs print-server     # Ver logs en tiempo real
pm2 status                 # Estado del servidor
pm2 restart print-server   # Reiniciar
pm2 stop print-server      # Detener
```

### **Ver conectividad con impresora:**
```bash
nc -zv 192.168.100.101 9100  # Probar conexión TCP
```

### **Reiniciar Raspberry Pi:**
```bash
sudo reboot
```

---

## 🆘 **SOLUCIÓN DE PROBLEMAS:**

### **❌ "Cannot connect to printer"**
```bash
# Verificar red
ping 192.168.100.101

# Probar conexión directa
echo -e "\x1B\x40" | nc 192.168.100.101 9100

# Verificar configuración
cat ~/config/printer-config.json
```

### **❌ "PM2 process stopped"**
```bash
pm2 restart print-server
pm2 logs print-server
```

### **❌ "Cannot find Raspberry Pi IP"**
```bash
# En la Raspberry Pi:
hostname -I  # Muestra todas las IPs

# Desde Windows:
arp -a | findstr "b8-27-eb"  # IPs de Raspberry Pi
```

---

## 🎯 **ARQUITECTURA DEL SISTEMA:**

```
┌─────────────────┐
│  Tablets/PWA    │ (Clientes)
│  192.168.100.X  │
└────────┬────────┘
         │ HTTP POST /print
         │ JSON
         ▼
┌─────────────────────┐
│  Raspberry Pi       │ (Servidor)
│  192.168.100.50     │
│  Node.js + PM2      │
│  Puerto 3001        │
└────────┬────────────┘
         │ TCP Socket
         │ ESC/POS
         ▼
┌─────────────────────┐
│  Impresora Térmica  │
│  192.168.100.101    │
│  Puerto 9100        │
│  Modelo: 80-VIII    │
└─────────────────────┘
```

---

## 📝 **MANTENIMIENTO:**

### **Actualizar código del servidor:**
```bash
cd ~/server
git pull  # Si usas git
# O sube nuevos archivos con WinSCP/FileZilla
pm2 restart print-server
```

### **Backup de configuración:**
```bash
# Respaldar
cp ~/config/printer-config.json ~/config/printer-config.json.bak

# Restaurar
cp ~/config/printer-config.json.bak ~/config/printer-config.json
```

---

## 🎉 **¡LISTO!**

Ahora tienes un servidor de impresión profesional que:
- ✅ Arranca automáticamente
- ✅ Se recupera de errores
- ✅ Registra todo en logs
- ✅ Imprime instantáneamente vía red
- ✅ Funciona sin internet (solo necesita red local)

**Siguientes pasos:**
1. Flashea el USB con Raspberry Pi Imager
2. Enciende la Pi y conéctate por SSH
3. Ejecuta el script de instalación
4. Actualiza tu componente KitchenPrint.tsx
5. ¡Disfruta de impresiones rápidas! 🚀
