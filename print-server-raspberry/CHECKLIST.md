# 📋 CHECKLIST DE INSTALACIÓN

Usa este checklist para verificar cada paso:

## FASE 1: PREPARACIÓN USB ✅

- [ ] Descargué Raspberry Pi Imager desde https://www.raspberrypi.com/software/
- [ ] Instalé Raspberry Pi Imager en mi PC Windows
- [ ] Conecté mi USB Kingston de 16GB
- [ ] Verifiqué que el USB está vacío (se borrará todo)
- [ ] Abrí Raspberry Pi Imager

### Configuración en Raspberry Pi Imager:

- [ ] **DEVICE:** Seleccioné mi modelo de Raspberry Pi
- [ ] **OS:** Seleccioné "Raspberry Pi OS Lite (64-bit)"
- [ ] **STORAGE:** Seleccioné mi USB Kingston

### Configuración Avanzada (⚙️):

- [ ] Hostname: `printserver`
- [ ] ✅ Enable SSH (Use password authentication)
- [ ] Username: `pi`
- [ ] Password: `supernovaprint` (o personalizado: __________)
- [ ] ✅ Configure WiFi (opcional):
  - SSID: __________
  - Password: __________
  - Country: MX
- [ ] ✅ Timezone: America/Mexico_City
- [ ] ✅ Keyboard: us

### Flasheo:

- [ ] Click "WRITE" o "SIGUIENTE"
- [ ] Confirmé que quiero borrar el USB
- [ ] Esperé 5-10 minutos hasta completar
- [ ] Vi mensaje "Write Successful"

---

## FASE 2: HARDWARE ✅

- [ ] USB Kingston con Raspberry Pi OS insertado en la Pi
- [ ] Cable ethernet RJ45 conectado (Pi ↔ Router/Switch)
- [ ] Cable de corriente conectado (Pi encendió automáticamente)
- [ ] LED rojo encendido (alimentación)
- [ ] LED verde parpadeando (actividad)
- [ ] Esperé 2-3 minutos en primera arrancada

---

## FASE 3: ENCONTRAR IP DE LA RASPBERRY PI ✅

Probé uno de estos métodos:

### Método A: Ping por hostname
```powershell
ping printserver.local
```
- [ ] Obtuve respuesta con IP: __________

### Método B: Desde el router
- [ ] Accedí al router (192.168.100.1)
- [ ] Busqué "printserver" en dispositivos conectados
- [ ] IP encontrada: __________

### Método C: Conectar monitor
- [ ] Conecté monitor HDMI
- [ ] Conecté teclado USB
- [ ] Login: `pi` / `supernovaprint`
- [ ] Ejecuté: `hostname -I`
- [ ] IP: __________

**IP DE MI RASPBERRY PI:** __________

---

## FASE 4: CONEXIÓN SSH ✅

```powershell
ssh pi@[IP_DE_TU_PI]
```

- [ ] Me conecté exitosamente por SSH
- [ ] Password correcto: `supernovaprint`
- [ ] Vi el prompt: `pi@printserver:~ $`

---

## FASE 5: COPIAR ARCHIVOS ✅

Desde mi PC Windows (PowerShell):

```powershell
scp -r "c:\Users\Alecs\Desktop\ddu\manu soft\print-server-raspberry\server" pi@[IP]:/home/pi/
scp -r "c:\Users\Alecs\Desktop\ddu\manu soft\print-server-raspberry\config" pi@[IP]:/home/pi/
scp "c:\Users\Alecs\Desktop\ddu\manu soft\print-server-raspberry\tools\setup-raspberry.sh" pi@[IP]:/home/pi/
```

- [ ] Carpeta `server` copiada
- [ ] Carpeta `config` copiada
- [ ] Archivo `setup-raspberry.sh` copiado

---

## FASE 6: INSTALACIÓN AUTOMÁTICA ✅

En la Raspberry Pi (SSH):

```bash
cd ~
chmod +x setup-raspberry.sh
./setup-raspberry.sh
```

- [ ] Script de instalación ejecutado
- [ ] Node.js 20 instalado
- [ ] PM2 instalado
- [ ] Dependencias npm instaladas
- [ ] Conexión a impresora verificada
- [ ] Servidor iniciado con PM2
- [ ] PM2 configurado para auto-inicio

---

## FASE 7: VERIFICACIÓN ✅

### En la Raspberry Pi:

```bash
pm2 status
```
- [ ] Estado: `online`
- [ ] Restart: `0`

```bash
pm2 logs print-server --lines 20
```
- [ ] Sin errores críticos
- [ ] Muestra "Servidor listo en http://0.0.0.0:3001"

### Desde mi PC:

```powershell
curl http://[IP_DE_PI]:3001/status
```
- [ ] Respuesta JSON recibida
- [ ] `"status": "online"`
- [ ] `"connected": true`

### Prueba de impresión:

```powershell
curl -X POST http://[IP_DE_PI]:3001/print/test
```
- [ ] ✅ ¡IMPRESORA IMPRIMIÓ TICKET DE PRUEBA!

---

## FASE 8: CONFIGURAR APP ✅

### En mi proyecto Next.js:

1. Crear archivo `.env.local`:
```bash
NEXT_PUBLIC_PRINT_SERVER_URL=http://[IP_DE_PI]:3001
```
- [ ] Archivo `.env.local` creado
- [ ] Variable configurada con IP correcta

2. Reemplazar `app/admin/orders/components/KitchenPrint.tsx`:
- [ ] Respaldé el archivo original
- [ ] Copié el contenido de `KitchenPrint-ACTUALIZADO.tsx`
- [ ] Guardé los cambios

3. Reconstruir app:
```powershell
pnpm run build
```
- [ ] Build exitoso sin errores

4. Desplegar a producción:
```powershell
git add .
git commit -m "feat: integración con servidor de impresión Raspberry Pi"
git push origin main
ssh root@72.60.168.4 "cd /var/www/restaurante && git pull && pnpm run build && pm2 restart restaurante"
```
- [ ] Cambios subidos a Git
- [ ] Deploy a VPS completado
- [ ] PM2 reiniciado

---

## FASE 9: PRUEBA FINAL ✅

Desde la app web (tablet/móvil):

- [ ] Abrí panel de órdenes
- [ ] Seleccioné una orden
- [ ] Click en "Imprimir en Cocina"
- [ ] Vi indicador "Impresora conectada" (con ícono Wifi verde)
- [ ] ✅ **¡IMPRESORA IMPRIMIÓ LA ORDEN!**

---

## PRUEBAS ADICIONALES ✅

### Modo Offline (Fallback):

- [ ] Apagué la Raspberry Pi
- [ ] Intenté imprimir desde la app
- [ ] Vi indicador "Modo tradicional" (con ícono Wifi naranja)
- [ ] Se abrió diálogo de impresión del navegador
- [ ] ✅ Modo fallback funciona

### Auto-recuperación:

- [ ] Reinicié la Raspberry Pi: `sudo reboot`
- [ ] Esperé 2 minutos
- [ ] Verifiqué que el servidor está activo: `pm2 status`
- [ ] ✅ Servidor arrancó automáticamente

---

## MANTENIMIENTO ✅

### Comandos útiles anotados:

```bash
# Ver logs en tiempo real
pm2 logs print-server

# Ver estado
pm2 status

# Reiniciar servidor
pm2 restart print-server

# Ver IP de la Pi
hostname -I

# Probar impresora
nc -zv 192.168.100.101 9100
```

- [ ] Practiqué los comandos básicos
- [ ] Guardé este checklist para referencia

---

## ✅ INSTALACIÓN COMPLETADA

**Fecha:** __________

**IP Raspberry Pi:** __________

**IP Impresora:** 192.168.100.101

**Puerto Servidor:** 3001

**Estado:** 🎉 TODO FUNCIONANDO

---

## 📸 EVIDENCIAS (OPCIONAL)

Toma capturas de pantalla de:

- [ ] `pm2 status` mostrando servidor online
- [ ] Ticket de prueba impreso
- [ ] Orden real impresa desde la app
- [ ] Indicador "Impresora conectada" en la app

---

## 🎓 PRÓXIMOS PASOS

- [ ] Documentar IP de la Raspberry Pi en lugar visible
- [ ] Crear respaldo de la configuración
- [ ] Entrenar al personal sobre el nuevo sistema
- [ ] Monitorear logs durante primera semana
- [ ] Celebrar que ya no usarás window.print() 🎉

---

**¡FELICIDADES! Sistema de impresión profesional instalado.** 🚀
