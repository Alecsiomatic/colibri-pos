# 🚚 Guía para Crear y Gestionar Repartidores

## 1. Crear un nuevo repartidor

### Opción A: Usando el script automatizado

```powershell
# Desde la raíz del proyecto
npm run create-driver

# O con tsx directamente
npx tsx scripts/create-driver.ts
```

El script te pedirá:
- ✅ Nombre completo
- ✅ Email (único)
- ✅ Contraseña
- ✅ Teléfono (opcional)

**Ejemplo de ejecución:**
```
🚚 Crear Nuevo Repartidor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nombre completo: Juan Pérez
Email: juan@example.com
Contraseña: Delivery2024!
Teléfono (opcional): +56912345678

⏳ Creando repartidor...

✅ ¡Repartidor creado exitosamente!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Credenciales:
   Email:    juan@example.com
   Password: Delivery2024!
   Nombre:   Juan Pérez
   Teléfono: +56912345678

🔗 Panel de acceso:
   https://tudominio.com/driver/dashboard
```

### Opción B: Manualmente en la base de datos

```sql
-- 1. Hash la contraseña con bcrypt (rounds=10)
-- Puedes usar: https://bcrypt-generator.com/

-- 2. Insertar el usuario
INSERT INTO users (
  email, 
  password, 
  name, 
  phone, 
  is_driver, 
  role, 
  created_at
) VALUES (
  'repartidor@example.com',
  '$2a$10$...hashedpassword...', -- Hash de bcrypt
  'Juan Pérez',
  '+56912345678',
  1,
  'driver',
  NOW()
);
```

---

## 2. Acceso al Panel de Repartidor

### 🔗 URLs importantes

- **Login:** `https://tudominio.com/login`
- **Panel de Repartidor:** `https://tudominio.com/driver/dashboard`

### 🎯 Acceso visible en el Header

Los repartidores verán automáticamente en el header:
- **Desktop:** Link "🚚 Panel de Repartidor" en color verde
- **Mobile:** Sección "REPARTIDOR" en el menú hamburguesa

**Condición:** Solo si `user.is_driver = 1` y `user.is_admin = 0`

---

## 3. Flujo de Trabajo del Repartidor

### Vista del Dashboard

```
┌─────────────────────────────────────────┐
│  🚚 Panel de Repartidor                 │
│                                          │
│  👤 Juan Pérez                           │
│  📧 juan@example.com                     │
│                                          │
│  📊 Estadísticas:                        │
│     ├─ Pendientes:   3                  │
│     ├─ En camino:    1                  │
│     └─ Completadas: 24                  │
│                                          │
│  📋 PEDIDOS ASIGNADOS:                   │
│  ┌───────────────────────────────────┐  │
│  │ Pedido #1234                      │  │
│  │ Cliente: María González           │  │
│  │ Dirección: Av. Principal 123      │  │
│  │ Total: $25.900                    │  │
│  │                                   │  │
│  │ [Aceptar] [Rechazar]              │  │
│  └───────────────────────────────────┘  │
│                                          │
│  🚗 EN CAMINO:                           │
│  ┌───────────────────────────────────┐  │
│  │ Pedido #1230                      │  │
│  │ [Ver Mapa] [Marcar Entregado]     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Estados del Pedido para Repartidores

1. **assigned_to_driver** → Aparece en "Pedidos Asignados"
   - Acciones: `[Aceptar]` o `[Rechazar]`

2. **accepted_by_driver** → Aparece en "Listos para Recoger"
   - Acción: `[Iniciar Entrega]`

3. **in_delivery** → Aparece en "En Camino"
   - Acciones: `[Ver Mapa]` `[Compartir Ubicación]` `[Marcar Entregado]`

4. **delivered** → Aparece en "Completadas"
   - Solo lectura, historial

---

## 4. Sistema de Tracking en Tiempo Real

### Para el Repartidor

Cuando marca "Iniciar Entrega":
- 📍 Su ubicación se comparte automáticamente cada 10 segundos
- 🗺️ Ve el mapa con su posición y el destino
- 📱 Puede llamar al cliente con un botón
- ⏱️ Ve el tiempo estimado de llegada

### Para el Cliente

- 🔗 Recibe link de tracking: `/orders/[id]/tracking`
- 🚚 Ve la ubicación del repartidor en tiempo real
- 📞 Puede contactar al repartidor
- 🕐 Ve tiempo estimado de llegada

---

## 5. Gestión de Repartidores (Admin)

### Ver todos los repartidores

```sql
SELECT id, name, email, phone, is_driver, created_at 
FROM users 
WHERE is_driver = 1
ORDER BY created_at DESC;
```

### Desactivar un repartidor

```sql
-- Opción 1: Quitar permisos de repartidor
UPDATE users SET is_driver = 0 WHERE id = 123;

-- Opción 2: Eliminar usuario (NO recomendado si tiene historial)
DELETE FROM users WHERE id = 123;
```

### Cambiar contraseña de un repartidor

```powershell
# 1. Generar hash de la nueva contraseña
npx tsx -e "import bcrypt from 'bcryptjs'; bcrypt.hash('NuevaPass2024', 10).then(console.log)"

# 2. Actualizar en la base de datos
# UPDATE users SET password = '$2a$10$...' WHERE email = 'repartidor@example.com';
```

---

## 6. Configurar Auto-Asignación (Próximamente)

### Estado Actual
- ✅ Asignación **manual** desde `/admin/delivery`
- ❌ Auto-asignación **NO** implementada

### Próxima Implementación
```typescript
// Cuando un pedido pasa a "ready":
// 1. Buscar repartidores disponibles (sin entregas activas)
// 2. Asignar al más cercano o al primero disponible
// 3. Enviar notificación automática
```

---

## 7. Agregar Script al package.json

```json
{
  "scripts": {
    "create-driver": "tsx scripts/create-driver.ts"
  }
}
```

Ahora puedes ejecutar:
```powershell
npm run create-driver
```

---

## 8. Mejores Prácticas

### Seguridad
- ✅ Usar contraseñas fuertes (mínimo 8 caracteres)
- ✅ El repartidor debe cambiar su contraseña en el primer login
- ✅ No compartir credenciales

### Gestión
- ✅ Crear un repartidor por persona física
- ✅ Mantener actualizado el número de teléfono
- ✅ Revisar estadísticas regularmente
- ✅ Capacitar a los repartidores en el uso del panel

### Operación
- ✅ Los repartidores deben habilitar ubicación en su dispositivo
- ✅ Mantener la app abierta durante entregas
- ✅ Confirmar recepción antes de salir
- ✅ Marcar entregado solo cuando el cliente reciba

---

## 9. Solución de Problemas

### "No puedo acceder al panel"
1. Verificar que `is_driver = 1` en la base de datos
2. Limpiar caché del navegador
3. Verificar que la sesión esté activa

### "No veo pedidos asignados"
1. Verificar en `/admin/delivery` que hay pedidos asignados
2. Refrescar la página
3. Verificar estado del pedido (debe ser `assigned_to_driver`)

### "El tracking no funciona"
1. Verificar permisos de ubicación en el navegador
2. Verificar Google Maps API Key
3. Verificar conexión a internet

---

## 10. Contacto y Soporte

Para problemas técnicos o dudas:
- 📧 Email: soporte@tudominio.com
- 📱 WhatsApp: +56912345678
- 🌐 Panel Admin: `/admin/dashboard`
