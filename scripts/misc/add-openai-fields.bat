@echo off
echo Agregando campos de OpenAI...

"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p"Manu2024*" delivery_management < "C:\Users\Alecs\Desktop\ddu\manu soft\scripts\add-openai-fields.sql"

if %errorlevel% equ 0 (
    echo ✅ Campos de OpenAI agregados correctamente
) else (
    echo ❌ Error al agregar campos de OpenAI
)

pause