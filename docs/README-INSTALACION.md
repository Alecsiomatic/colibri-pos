# 🎯 INSTRUCCIONES FINALES - MIGRACIÓN MYSQL

## 🚨 **ACCIÓN REQUERIDA AHORA:**

### **Opción 1: Instalación Automática (RECOMENDADA)**

1. **Abre el Explorador de Windows**
2. **Navega a:** `C:\Users\Alecs\Desktop\ddu\manu soft`
3. **Doble clic en:** `install-mysql.bat`
4. **Espera a que termine** (instalará todo automáticamente)

### **Opción 2: Instalación Manual**

Abre **Command Prompt** y ejecuta paso a paso:

```cmd
cd /d "C:\Users\Alecs\Desktop\ddu\manu soft"
npm install mysql2 @types/mysql2
node test-mysql-connection.js
node scripts/init-mysql-db.js
```

## 📊 **QUE HACE LA INSTALACIÓN:**

1. ✅ **Instala mysql2** - Driver de MySQL para Node.js
2. ✅ **Instala @types/mysql2** - Tipos TypeScript  
3. ✅ **Prueba conexión** - Verifica acceso a tu base de datos
4. ✅ **Crea tablas** - Inicializa esquema completo (11 tablas)
5. ✅ **Configura usuario admin** - admin@restaurant.com / admin123

## 🗃️ **TABLAS QUE SE CREARÁN:**

1. `users` - Usuarios del sistema
2. `categories` - Categorías de productos
3. `products` - Productos del menú  
4. `orders` - Pedidos de clientes
5. `delivery_drivers` - Repartidores
6. `delivery_assignments` - Asignaciones de delivery
7. `chat_conversations` - Conversaciones de chat
8. `chat_messages` - Mensajes de WhatsApp/chat
9. `inventory` - Control de inventario
10. `user_sessions` - Sesiones JWT
11. `system_config` - Configuración del sistema

## 🔐 **CREDENCIALES DE ACCESO:**

- **Usuario Admin:** admin@restaurant.com
- **Contraseña:** admin123  
- **Base de datos:** srv440.hstgr.io
- **JWT Secret:** Configurado automáticamente

## ⚡ **DESPUÉS DE LA INSTALACIÓN:**

```cmd
npm run dev
```

Luego visita: **http://localhost:3000**

## 🆘 **SI HAY PROBLEMAS:**

1. **Error de red:** Usar VPN o proxy
2. **Error MySQL:** Verificar credenciales en `.env.local`
3. **Error Node.js:** Instalar desde nodejs.org
4. **Error permisos:** Ejecutar CMD como administrador

---

## 🎉 **BENEFICIOS DE LA MIGRACIÓN:**

✅ **Una sola base de datos** (no más Supabase + SQLite)  
✅ **Control total** sobre tus datos  
✅ **Sin costos externos** de Supabase  
✅ **Mejor rendimiento** con MySQL directo  
✅ **Escalabilidad completa**  

**¡Tu software estará mucho más optimizado después de esto!** 🚀