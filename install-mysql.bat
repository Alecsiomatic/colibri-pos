@echo off
echo.
echo ============================================
echo 🚀 MANU SOFT - INSTALACION MYSQL
echo ============================================
echo.

echo 📍 Navegando al directorio del proyecto...
cd /d "%~dp0"

echo.
echo 🔍 Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado o no está en el PATH
    echo 💡 Instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detectado: 
node --version

echo.
echo 📦 Instalando dependencias MySQL...
npm install mysql2

if errorlevel 1 (
    echo.
    echo ❌ Error al instalar dependencias
    echo 💡 Posibles soluciones:
    echo    - Verificar conexión a internet
    echo    - Usar VPN si hay restricciones de red
    echo    - Ejecutar: npm cache clean --force
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Dependencias instaladas exitosamente!

echo.
echo 🔌 Probando conexión a MySQL...
node test-mysql-connection.js

if errorlevel 1 (
    echo.
    echo ❌ Error de conexión a MySQL
    echo 💡 Verifica las credenciales en .env.local
    echo.
    pause
    exit /b 1
)

echo.
echo 🗃️ Inicializando base de datos...
node scripts/init-mysql-db.js

if errorlevel 1 (
    echo.
    echo ❌ Error al inicializar base de datos
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo 🎉 INSTALACION COMPLETADA EXITOSAMENTE!
echo ============================================
echo.
echo ✅ MySQL conectado
echo ✅ Base de datos inicializada  
echo ✅ Sistema listo para usar
echo.
echo 🚀 Para ejecutar la aplicación:
echo    npm run dev
echo.
pause