# 🚀 GUÍA RÁPIDA DE INSTALACIÓN - MYSQL

## 📋 Pasos para Completar la Migración

### 1. ✅ **Instalar Dependencias MySQL**

Abre **Command Prompt (CMD)** y ejecuta:

```cmd
cd /d "C:\Users\Alecs\Desktop\ddu\manu soft"
npm install mysql2 @types/mysql2
```

O usa el script automatizado:
```cmd
npm run install-mysql
```

### 2. ✅ **Probar Conexión a MySQL**

```cmd
npm run test-mysql
```

O ejecutar directamente:
```cmd
node test-mysql-connection.js
```

### 3. ✅ **Inicializar Base de Datos**

```cmd
npm run init-db
```

O ejecutar directamente:
```cmd
node scripts/init-mysql-db.js
```

### 4. ✅ **Verificar Configuración**

Asegúrate de que existe el archivo `.env.local` con:
```env
DB_HOST=srv440.hstgr.io
DB_USER=u191251575_manu
DB_PASSWORD=Cerounocero.com20182417
DB_NAME=u191251575_manu
DB_PORT=3306
JWT_SECRET=manu-restaurant-secret-key-2025-secure
JWT_REFRESH_SECRET=manu-restaurant-refresh-key-2025-secure
NODE_ENV=development
```

### 5. ✅ **Probar la Aplicación**

```cmd
npm run dev
```

## 🔧 Scripts Disponibles

- `npm run test-mysql` - Probar conexión MySQL
- `npm run init-db` - Inicializar base de datos
- `npm run install-mysql` - Instalar dependencias MySQL
- `npm run dev` - Ejecutar aplicación en desarrollo

## 📊 Estado Actual

✅ Configuración MySQL creada  
✅ Esquema de base de datos listo  
✅ Sistema de autenticación JWT  
✅ APIs de login/registro  
✅ Variables de entorno configuradas  
⏳ Pendiente: Instalar mysql2  
⏳ Pendiente: Inicializar base de datos  

## 🚨 Solución de Problemas

### Error de Conexión:
- Verificar credenciales en `.env.local`
- Comprobar conectividad de red
- Validar permisos del usuario de BD

### Error de Instalación NPM:
- Usar VPN si hay problemas de red
- Probar `npm install --registry https://registry.npmjs.org/`
- Limpiar caché: `npm cache clean --force`

## 📞 Próximos Pasos

1. **Resolver instalación de mysql2**
2. **Ejecutar inicialización de BD**
3. **Migrar APIs restantes**
4. **Actualizar componentes frontend**
5. **Eliminar dependencias de Supabase**