@echo off
echo ============================================
echo  LIMPIAR HISTORIAL DE ORDENES
echo  Supernova Burgers - Reset para Produccion
echo ============================================
echo.

echo ⚠️  ADVERTENCIA: Este script eliminara:
echo    - Todas las ordenes
echo    - Todos los items de ordenes  
echo    - Historial de compras
echo.
echo ✅ Se mantendran:
echo    - Usuarios (admin, clientes, etc)
echo    - Productos y categorias
echo    - Configuracion del sistema
echo.

set /p confirm="¿Estas seguro? (s/N): "
if /i not "%confirm%"=="s" (
    echo Operacion cancelada.
    pause
    exit /b 0
)

echo.
echo 🧹 Ejecutando limpieza local...
node scripts\clean-orders-history.js

if errorlevel 1 (
    echo ❌ Error en la limpieza local
    pause
    exit /b 1
)

echo.
echo 🌐 ¿Quieres limpiar tambien el VPS? (s/N): 
set /p cleanVPS=""
if /i "%cleanVPS%"=="s" (
    echo.
    echo 🧹 Limpiando historial en VPS...
    ssh root@72.60.168.4 "cd /var/www/restaurante && node scripts/clean-orders-history.js"
    
    if errorlevel 1 (
        echo ❌ Error en la limpieza del VPS
        pause
        exit /b 1
    )
    
    echo ✅ VPS limpiado exitosamente
)

echo.
echo ============================================
echo ✅ LIMPIEZA COMPLETADA!
echo ============================================
echo.
echo Tu sistema esta listo para produccion:
echo 🌐 https://supernovaburguers.shop
echo.
echo Proximos pasos:
echo  1. Verificar panel de admin
echo  2. Hacer orden de prueba
echo  3. ¡Recibir clientes reales!
echo.
pause