@echo off
echo ============================================
echo  Actualizando VPS (sin commit local)
echo ============================================
echo.

echo Conectando al VPS y actualizando...
echo.

ssh root@72.60.168.4 "cd /var/www/restaurante && echo '[1/3] Descargando cambios del repo...' && git fetch --all && git reset --hard origin/main && git pull origin main && echo '[2/3] Instalando dependencias...' && pnpm install && echo '[3/3] Building y reiniciando...' && pnpm run build && pm2 restart restaurante && echo '' && echo '==================================' && echo 'VPS actualizado exitosamente!' && echo '==================================' && echo '' && pm2 status restaurante"

echo.
echo ============================================
echo  Listo! Tu sitio esta actualizado
echo  https://supernovaburguers.shop
echo ============================================
pause
