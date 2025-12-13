# Script para descargar Node.js portable para Raspberry Pi 3
# IMPORTANTE: Ejecutar SOLO desde Windows PowerShell en tu PC

$NODE_VERSION = "v18.20.5"  # Versión LTS compatible con Raspberry Pi 3
$NODE_ARCH = "linux-armv7l"  # Arquitectura ARMv7 para Raspberry Pi 3
$NODE_URL = "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-$NODE_ARCH.tar.xz"
$DOWNLOAD_DIR = "$PSScriptRoot\downloads"
$NODE_DIR = "$PSScriptRoot\node-portable"

Write-Host "=================================================="  -ForegroundColor Green
Write-Host "🚀 DESCARGANDO NODE.JS PORTABLE" -ForegroundColor Green
Write-Host "=================================================="  -ForegroundColor Green
Write-Host ""

# Crear directorio de descargas
if (-not (Test-Path $DOWNLOAD_DIR)) {
    New-Item -ItemType Directory -Path $DOWNLOAD_DIR | Out-Null
}

$NODE_FILE = "$DOWNLOAD_DIR\node-$NODE_VERSION-$NODE_ARCH.tar.xz"

# Verificar si ya existe
if (Test-Path $NODE_FILE) {
    Write-Host "✅ Node.js ya descargado: $NODE_FILE" -ForegroundColor Yellow
    $response = Read-Host "¿Volver a descargar? (s/n)"
    if ($response -ne "s") {
        Write-Host "⏭️  Usando archivo existente" -ForegroundColor Yellow
    } else {
        Remove-Item $NODE_FILE -Force
        Write-Host "🔄 Descargando Node.js $NODE_VERSION para Raspberry Pi 3..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $NODE_URL -OutFile $NODE_FILE
        Write-Host "✅ Descarga completada" -ForegroundColor Green
    }
} else {
    Write-Host "🔄 Descargando Node.js $NODE_VERSION para Raspberry Pi 3..." -ForegroundColor Cyan
    Write-Host "📦 URL: $NODE_URL" -ForegroundColor Gray
    Write-Host ""
    try {
        Invoke-WebRequest -Uri $NODE_URL -OutFile $NODE_FILE
        Write-Host "✅ Descarga completada" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error al descargar Node.js" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=================================================="  -ForegroundColor Green
Write-Host "📦 ARCHIVO DESCARGADO" -ForegroundColor Green
Write-Host "=================================================="  -ForegroundColor Green
Write-Host ""
Write-Host "📁 Ubicación: $NODE_FILE"
Write-Host "📊 Tamaño: $([math]::Round((Get-Item $NODE_FILE).Length / 1MB, 2)) MB"
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Este archivo necesita ser EXTRAÍDO en Linux (Raspberry Pi)." -ForegroundColor Yellow
Write-Host "Windows no puede extraer archivos .tar.xz correctamente." -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copia TODO el contenido de 'usb-printserver' a la USB" -ForegroundColor White
Write-Host "2. Copia el archivo descargado también" -ForegroundColor White
Write-Host "3. En la Raspberry Pi ejecuta:" -ForegroundColor White
Write-Host ""
Write-Host "   cd ~/printserver-usb/downloads" -ForegroundColor Gray
Write-Host "   tar -xf node-$NODE_VERSION-$NODE_ARCH.tar.xz" -ForegroundColor Gray
Write-Host "   mv node-$NODE_VERSION-$NODE_ARCH ../node-portable" -ForegroundColor Gray
Write-Host ""
Write-Host "=================================================="  -ForegroundColor Green

Write-Host ""
Write-Host "✅ ¡Listo! Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
