@echo off
REM ============================================
REM GUÍA PARA FLASHEAR USB EN WINDOWS
REM Servidor de Impresión Raspberry Pi
REM ============================================

echo.
echo ========================================
echo PREPARACION DE USB KINGSTON 16GB
echo ========================================
echo.

echo PASO 1: Descargar Raspberry Pi Imager
echo ----------------------------------------
echo 1. Ve a: https://www.raspberrypi.com/software/
echo 2. Descarga "Raspberry Pi Imager for Windows"
echo 3. Instala el programa (Next, Next, Finish)
echo.
pause

echo.
echo PASO 2: Conectar USB
echo ----------------------------------------
echo 1. Conecta tu USB Kingston de 16GB
echo 2. ADVERTENCIA: Se borrara TODO el contenido
echo 3. Anota la letra de unidad (ejemplo: E:, F:, G:)
echo.
pause

echo.
echo PASO 3: Abrir Raspberry Pi Imager
echo ----------------------------------------
echo 1. Abre "Raspberry Pi Imager"
echo 2. Sigue las instrucciones en pantalla
echo.
pause

echo.
echo PASO 4: Seleccionar Dispositivo
echo ----------------------------------------
echo Click en "CHOOSE DEVICE"
echo.
echo Selecciona tu modelo de Raspberry Pi:
echo - Raspberry Pi 3
echo - Raspberry Pi 4
echo - Raspberry Pi 5
echo.
pause

echo.
echo PASO 5: Seleccionar Sistema Operativo
echo ----------------------------------------
echo Click en "CHOOSE OS"
echo.
echo 1. Scroll down hasta "Raspberry Pi OS (other)"
echo 2. Selecciona: "Raspberry Pi OS Lite (64-bit)"
echo    - SIN escritorio
echo    - Optimizado para servidor
echo.
pause

echo.
echo PASO 6: Seleccionar USB
echo ----------------------------------------
echo Click en "CHOOSE STORAGE"
echo.
echo 1. Selecciona tu USB Kingston (16GB)
echo 2. VERIFICA que sea el correcto
echo 3. Click en tu USB
echo.
pause

echo.
echo PASO 7: Configuracion Avanzada (IMPORTANTE)
echo ----------------------------------------
echo Click en el ICONO DE ENGRANAJE (⚙️)
echo O presiona: Ctrl + Shift + X
echo.
pause

echo.
echo CONFIGURACION REQUERIDA:
echo ----------------------------------------
echo.
echo [Hostname]
echo   printserver
echo.
echo [Enable SSH]
echo   [✓] Enable SSH
echo   (*) Use password authentication
echo.
echo [Username and Password]
echo   Username: pi
echo   Password: supernovaprint
echo   (O el que tu quieras - ANOTALO!)
echo.
echo [Configure WiFi] (OPCIONAL si usas cable)
echo   [✓] Configure wireless LAN
echo   SSID: [Nombre de tu WiFi]
echo   Password: [Contraseña WiFi]
echo   Wireless LAN country: MX
echo.
echo [Locale Settings]
echo   Time zone: America/Mexico_City
echo   Keyboard layout: us
echo.
echo Click SAVE
echo.
pause

echo.
echo PASO 8: Escribir Imagen
echo ----------------------------------------
echo 1. Click en "WRITE" (o "SIGUIENTE")
echo 2. Confirma que quieres borrar el USB
echo 3. Click "YES" (o "SI")
echo.
echo ⏳ ESPERANDO (5-10 minutos)...
echo.
echo El programa hara:
echo  - Descargar Raspberry Pi OS Lite
echo  - Escribir al USB
echo  - Verificar la escritura
echo.
echo ☕ Ve por un cafe...
echo.
pause

echo.
echo PASO 9: Copiar Archivos del Servidor
echo ----------------------------------------
echo Una vez terminado el flasheo:
echo.
echo 1. NO quites el USB aun
echo 2. Abre Windows Explorer
echo 3. Copia la carpeta "server" a una USB diferente
echo    O súbela a tu Raspberry Pi despues por SSH
echo.
pause

echo.
echo PASO 10: Listo para usar
echo ----------------------------------------
echo 1. Saca el USB de la computadora
echo 2. Ve al README.md - PASO 2
echo 3. Continua con "Primera vez encendiendo la Pi"
echo.
pause

echo.
echo ========================================
echo ✅ USB PREPARADO
echo ========================================
echo.
echo SIGUIENTE: Conectar la Raspberry Pi
echo Ver: README.md - PASO 2
echo.
pause

exit
