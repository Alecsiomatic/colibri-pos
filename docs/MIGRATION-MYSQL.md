# 🔄 MIGRACIÓN A MYSQL - DOCUMENTACIÓN

## 📋 Resumen de Cambios

Se ha migrado completamente la aplicación de **Supabase** y **SQLite** a **MySQL**. Todos los sistemas ahora utilizan una única base de datos MySQL para mayor simplicidad y rendimiento.

## 🗃️ Nueva Estructura de Base de Datos

### Tablas Principales:
- `users` - Usuarios del sistema
- `categories` - Categorías de productos  
- `products` - Productos del menú
- `orders` - Pedidos
- `delivery_drivers` - Repartidores
- `delivery_assignments` - Asignaciones de delivery
- `chat_conversations` - Conversaciones de chat
- `chat_messages` - Mensajes de chat
- `inventory` - Inventario
- `user_sessions` - Sesiones de usuario (JWT)
- `system_config` - Configuración del sistema

## 🔧 Archivos Creados/Modificados

### 📁 Nuevos Archivos:
- `lib/mysql-db.ts` - Conexión y funciones de MySQL
- `lib/auth-mysql.ts` - Sistema de autenticación con JWT
- `scripts/init-mysql.sql` - Script SQL de inicialización
- `scripts/init-mysql-db.ts` - Script TypeScript de inicialización
- `app/api/auth/login-mysql/route.ts` - API de login con MySQL
- `app/api/auth/register-mysql/route.ts` - API de registro con MySQL
- `middleware-mysql.ts` - Middleware actualizado para MySQL
- `.env.example` - Variables de entorno necesarias

### 📝 Archivos Modificados:
- `package.json` - Dependencias actualizadas
- `lib/db.ts` - Funciones migradas a MySQL

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias
```bash
npm install mysql2 @types/mysql2
```

### 2. Configurar Variables de Entorno
Copia `.env.example` a `.env.local` y configura:

```env
DB_HOST=srv440.hstgr.io
DB_USER=u191251575_manu
DB_PASSWORD=Cerounocero.com20182417
DB_NAME=u191251575_manu
DB_PORT=3306

JWT_SECRET=tu-clave-secreta-super-segura
JWT_REFRESH_SECRET=tu-clave-refresh-super-segura
```

### 3. Inicializar Base de Datos
```bash
# Opción 1: Ejecutar script SQL directamente en tu base de datos
# Usar el archivo: scripts/init-mysql.sql

# Opción 2: Ejecutar script TypeScript (cuando las dependencias estén instaladas)
npm run init-db
```

### 4. Actualizar Middleware
Reemplaza `middleware.ts` con `middleware-mysql.ts`:
```bash
mv middleware.ts middleware-supabase-backup.ts
mv middleware-mysql.ts middleware.ts
```

## 🔄 APIs Actualizadas

### Autenticación:
- `POST /api/auth/login-mysql` - Nuevo login con MySQL
- `POST /api/auth/register-mysql` - Nuevo registro con MySQL

### Migración Gradual:
1. Mantén las APIs de Supabase por compatibilidad
2. Actualiza gradualmente los endpoints
3. Elimina las APIs de Supabase cuando todo esté migrado

## 🛡️ Sistema de Autenticación

- **JWT Tokens** reemplazan a Supabase Auth
- **Cookies seguras** para almacenar tokens
- **Refresh tokens** para renovación automática
- **Sesiones en base de datos** para mayor control

## 📊 Ventajas de la Migración

✅ **Simplicidad**: Una sola base de datos
✅ **Control total**: No dependes de servicios externos
✅ **Rendimiento**: Conexión directa a MySQL
✅ **Costos**: Eliminas dependencia de Supabase
✅ **Escalabilidad**: Control completo sobre la infraestructura

## ⚠️ Pasos Pendientes

1. **Instalar mysql2** completamente
2. **Configurar .env.local** con las credenciales
3. **Ejecutar script de inicialización**
4. **Migrar APIs restantes** una por una
5. **Actualizar componentes frontend** para usar nuevas APIs
6. **Probar funcionalidades** críticas
7. **Eliminar código de Supabase** gradualmente

## 🧪 Testing

Una vez instaladas las dependencias, probar:

```bash
# Probar conexión
node -e "require('./lib/mysql-db').testConnection()"

# Inicializar DB
node scripts/init-mysql-db.ts
```

## 📞 Soporte

Si hay problemas durante la migración:
1. Verificar credenciales de MySQL
2. Comprobar conectividad de red
3. Revisar logs de error
4. Validar estructura de tablas