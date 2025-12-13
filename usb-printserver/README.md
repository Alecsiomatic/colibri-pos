# 🖨️ Print Server USB - SuperNova Burgers

**Servidor de impresión completo para Raspberry Pi 3**  
Todo incluido - Sin necesidad de internet en la Raspberry Pi

---

## 📁 Contenido de esta carpeta

```
usb-printserver/
├── 📄 SOLUCION-SIMPLE.md          ⭐ EMPIEZA AQUÍ - Método más fácil
├── 📄 INSTALACION-RAPIDA.md       Instalación por USB o SCP
├── 📄 INSTRUCCIONES-USB.md        Guía completa detallada
├── 📜 install.sh                  Script de instalación automática
├── 📜 start-server.sh             Script para iniciar el servidor
├── 💻 DESCARGAR-NODEJS.ps1        (Opcional) Descargar Node.js portable
├── 📁 server/                     Código del servidor completo
│   ├── index.js                   Servidor Express principal
│   ├── printer.js                 Driver ESC/POS para impresora térmica
│   ├── package.json               Dependencias npm
│   └── test-print.js              Script de prueba
└── 📁 config/                     Configuración
    └── printer-config.json        IP y puerto de la impresora
```

---

## 🚀 INICIO RÁPIDO

### ¿La Raspberry Pi tiene red?

#### ✅ SÍ - Lee: `SOLUCION-SIMPLE.md`
**Este es el método MÁS RÁPIDO (5 minutos)**

```powershell
# Desde tu PC
cd "C:\Users\Alecs\Desktop\ddu\manu soft"
scp -r usb-printserver\server pi@192.168.100.98:~/
ssh pi@192.168.100.98
cd ~/server && npm install && node index.js
```

#### ❌ NO - Lee: `INSTALACION-RAPIDA.md`
Copia por USB (15 minutos)

---

## 📋 ¿Qué método usar?

| Situación | Archivo a leer | Tiempo |
|-----------|---------------|--------|
| 🟢 Raspberry Pi con red funcionando | `SOLUCION-SIMPLE.md` | 5 min |
| 🔴 Raspberry Pi sin red | `INSTALACION-RAPIDA.md` | 15 min |
| 📚 Quiero entender todo | `INSTRUCCIONES-USB.md` | 30 min |

---

## ⚡ Método Express (si tienes red)

```bash
# 1. Copiar archivos
scp -r usb-printserver\server pi@192.168.100.98:~/
scp usb-printserver\start-server.sh pi@192.168.100.98:~/

# 2. Conectar
ssh pi@192.168.100.98

# 3. Instalar dependencias
cd ~/server
npm install

# 4. Iniciar
cd ~
chmod +x start-server.sh
./start-server.sh
```

**¡Listo! ✅**

---

## 🔧 Configuración de la impresora

La impresora está configurada en: `config/printer-config.json`

```json
{
  "printer": {
    "name": "Thermal Printer 80-VIII",
    "ip": "192.168.100.101",
    "port": 9100,
    "protocol": "tcp",
    "width": 48
  }
}
```

**Para cambiar la IP:**
1. Edita: `config/printer-config.json`
2. Reinicia el servidor

---

## ✅ Verificación

Una vez iniciado el servidor, prueba desde tu PC:

```powershell
# Verificar estado
curl http://192.168.100.98:3001/status

# Prueba de impresión
curl -X POST http://192.168.100.98:3001/print/test
```

**Respuesta esperada:**
```json
{
  "status": "online",
  "printer": {
    "ip": "192.168.100.101",
    "port": 9100
  }
}
```

---

## 🌐 Integración con tu app React

En tu componente `KitchenPrint.tsx`:

```typescript
const PRINT_SERVER_URL = 'http://192.168.100.98:3001';

const printOrder = async (order) => {
  try {
    const response = await fetch(`${PRINT_SERVER_URL}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    
    if (response.ok) {
      console.log('✅ Orden impresa');
    }
  } catch (error) {
    console.error('❌ Error al imprimir:', error);
  }
};
```

---

## 🚨 Solución de problemas

### La Raspberry Pi no responde

```bash
# Reiniciar
sudo reboot

# Verificar IP
hostname -I

# Verificar red
ping 8.8.8.8
```

### El servidor no inicia

```bash
# Ver errores
cd ~/server
node index.js

# Ver puertos ocupados
sudo netstat -tulpn | grep 3001
```

### La impresora no imprime

```bash
# Verificar conexión
nc -zv 192.168.100.101 9100

# Ping a impresora
ping 192.168.100.101
```

---

## 📞 Soporte

Si algo no funciona, ejecuta esto y envía la salida:

```bash
cd ~/server
cat > diagnostico.txt << EOF
=== DIAGNÓSTICO PRINT SERVER ===
Fecha: $(date)

--- Sistema ---
$(uname -a)
$(uptime)
$(free -h)

--- Red ---
$(ip addr show)
$(ping -c 3 192.168.100.101)

--- Node.js ---
$(node --version 2>&1)
$(npm --version 2>&1)

--- Servidor ---
$(ls -la ~/server)
$(cat ~/server/package.json)

--- Logs ---
$(tail -n 50 ~/server.log 2>&1)
EOF

cat diagnostico.txt
```

---

## 🎯 Próximos pasos

1. ✅ Instalar el servidor
2. ✅ Verificar que imprime
3. ✅ Integrar con tu app React
4. ⬜ Configurar inicio automático (PM2)
5. ⬜ Monitorear logs
6. ⬜ Hacer backup

---

**¡Todo listo para imprimir! 🚀**
