@echo off
echo ============================================
echo  Actualizando Supernova Burgers en VPS
echo ============================================
echo.

REM Primero hacer commit y push local
echo [1/4] Guardando cambios locales...
git add .
git commit -m "Update: Fix categorias infinite loop and improvements"
git push origin main

if errorlevel 1 (
    echo Error al hacer push. Verifica tu repositorio.
    pause
    exit /b 1
)

echo.
echo [2/4] Conectando al VPS...
echo.

REM Ejecutar actualización en el VPS
ssh root@72.60.168.4 "cd /var/www/restaurante && echo '[3/4] Descargando cambios...' && git pull origin main && echo '[4/4] Instalando y rebuilding...' && pnpm install && pnpm run build && echo 'Reiniciando aplicacion...' && pm2 restart restaurante && echo '' && echo '==================================' && echo 'Actualizacion completada!' && echo '==================================' && pm2 status restaurante"

echo.
echo ============================================
echo  Deploy completado exitosamente!
echo  https://supernovaburguers.shop
echo ============================================
pause
