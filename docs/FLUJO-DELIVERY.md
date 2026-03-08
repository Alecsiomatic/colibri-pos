# 🚚 Sistema de Delivery - Guía Completa

## 📋 Flujo Actual del Sistema

### 1️⃣ Cliente Hace un Pedido

**Paso 1: Cliente en el checkout**
- Selecciona tipo de entrega:
  - 🚚 **Delivery a domicilio** (+$25.00)
  - 🏪 **Recoger en tienda** (Gratis)
- Ingresa dirección de entrega
- Confirma el pedido

**Resultado:** 
- Orden creada con `delivery_type = 'delivery'`
- Estado inicial: `pending`

---

### 2️⃣ Asignación de Repartidor (MANUAL actualmente)

**Panel Admin → Delivery** (`/admin/delivery`)

**Vista actual:**
- Lista de pedidos listos para entregar
- Lista de repartidores disponibles
- Admin selecciona manualmente:
  1. Click en pedido
  2. Selecciona repartidor de lista desplegable
  3. Click en "Asignar"

**Resultado:**
- Se crea registro en tabla `delivery_assignments`
- Estado del pedido: `pending` → `assigned_to_driver`
- Repartidor recibe notificación

---

### 3️⃣ Repartidor Recibe y Acepta

**Panel del Repartidor:** `/driver/dashboard`

**Cómo acceder:**
1. Ir a: `https://tudominio.com/driver/dashboard`
2. Login con credenciales de repartidor
   - Usuario con `is_driver = 1` en base de datos
   - Ejemplo: `driver@kalabasbooom.com` / `driver123`

**Vista del repartidor:**
- 📦 **Pedidos Pendientes** (asignados pero no aceptados)
  - Muestra: dirección, cliente, total, hora
  - Botón grande: **ACEPTAR PEDIDO**
  
- 🚗 **Entrega Activa** (aceptado pero no completado)
  - Mapa con ubicación del cliente
  - Dirección completa
  - Botón grande: **MARCAR COMO ENTREGADO**

**Acciones:**
1. **Aceptar pedido** → Estado: `accepted`, se activa tracking en tiempo real
2. **Completar entrega** → Estado: `completed`, orden marcada como `delivered`

---

### 4️⃣ Cliente Rastrea su Pedido

**Página de Tracking:** `/orders/[id]/tracking`

**Características:**
- Mapa interactivo de Google Maps
- Ubicación del repartidor en tiempo real (actualiza cada 10 seg)
- Información del pedido
- Estado actual

---

## 🔧 Mejoras Necesarias

### ❌ Problemas Actuales:

1. **Asignación Manual** - Admin debe asignar manualmente cada pedido
2. **No hay acceso directo** - Link al panel de repartidor no es obvio
3. **Sin auto-asignación** - No hay sistema automático de asignación

### ✅ Soluciones Propuestas:

#### 1. Sistema de Auto-Asignación

**Lógica:**
```
Cuando pedido está listo (status = 'ready'):
  1. Buscar repartidor disponible (sin entregas activas)
  2. Asignar automáticamente al primero disponible
  3. Notificar al repartidor
  4. Si no hay disponibles, mantener en cola
```

#### 2. Acceso Directo al Panel de Repartidor

**Agregar en el header/footer:**
- Link: "Portal de Repartidores"
- URL: `/driver/dashboard`
- Solo visible para usuarios con `is_driver = 1`

#### 3. Panel de Admin Mejorado

**Drag & Drop:**
- Arrastrar pedido a repartidor
- Visual claro
- Confirmación con un click

---

## 📱 Estados del Pedido

| Estado | Descripción | Quién lo cambia |
|--------|-------------|-----------------|
| `pending` | Pedido recibido | Sistema |
| `confirmed` | Pago confirmado | Sistema |
| `preparing` | En cocina | Admin |
| `ready` | Listo para entregar | Admin |
| `assigned_to_driver` | Asignado a repartidor | Admin/Sistema |
| `accepted_by_driver` | Repartidor aceptó | Repartidor |
| `in_delivery` | En camino | Repartidor |
| `delivered` | Entregado | Repartidor |

---

## 👥 Tipos de Usuarios

### Admin
- **Email:** `admin@kalabasbooom.com`
- **Password:** `admin123`
- **Permisos:** Acceso total
- **Panel:** `/admin/dashboard`

### Repartidor
- **Requisito:** `is_driver = 1` en tabla `users`
- **Panel:** `/driver/dashboard`
- **Funciones:**
  - Ver pedidos asignados
  - Aceptar entregas
  - Marcar como completadas
  - Actualizar ubicación

### Cliente
- **Registro:** `/register`
- **Login:** `/login`
- **Funciones:**
  - Hacer pedidos
  - Rastrear en tiempo real
  - Ver historial

---

## 🗄️ Estructura de Base de Datos

### Tabla: `delivery_assignments`
```sql
CREATE TABLE delivery_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  driver_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled'),
  assigned_at TIMESTAMP,
  accepted_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (driver_id) REFERENCES users(id)
)
```

### Tabla: `users` (campo importante)
```sql
is_driver BOOLEAN DEFAULT FALSE  -- Identifica si es repartidor
```

---

## 🚀 Cómo Crear un Repartidor

### Opción 1: Desde Admin Panel (futuro)
- Admin → Usuarios → Nuevo Repartidor
- Formulario con datos básicos
- Auto-marca `is_driver = 1`

### Opción 2: SQL Directo (actual)
```sql
-- Crear nuevo usuario repartidor
INSERT INTO users (email, password, name, is_driver, role) 
VALUES (
  'juan@delivery.com',
  '$2a$10$hashedpassword',  -- Usar bcrypt
  'Juan Pérez',
  1,
  'driver'
);

-- O convertir usuario existente en repartidor
UPDATE users 
SET is_driver = 1, role = 'driver' 
WHERE email = 'usuario@email.com';
```

### Opción 3: Script de Registro (recomendado)
```typescript
// Script: scripts/create-driver.ts
import bcrypt from 'bcryptjs'
import mysql from 'mysql2/promise'

async function createDriver(email: string, password: string, name: string) {
  const connection = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu'
  })
  
  const hashedPassword = await bcrypt.hash(password, 10)
  
  await connection.execute(
    'INSERT INTO users (email, password, name, is_driver, role) VALUES (?, ?, ?, 1, "driver")',
    [email, hashedPassword, name]
  )
  
  console.log(`✅ Repartidor ${name} creado exitosamente`)
  await connection.end()
}

createDriver('juan@delivery.com', 'password123', 'Juan Pérez')
```

---

## 📍 Seguimiento en Tiempo Real

### Cómo Funciona:

1. **Repartidor acepta pedido**
   - Se activa geolocalización en su dispositivo
   - Ubicación se actualiza cada 10 segundos

2. **Sistema guarda ubicación**
   - Endpoint: `POST /api/driver/location`
   - Guarda lat/lng en tabla `delivery_assignments`

3. **Cliente ve ubicación**
   - Página: `/orders/[id]/tracking`
   - Polling cada 10 segundos
   - Mapa de Google Maps actualizado

4. **Mapa interactivo**
   - 📍 Marcador: Ubicación del restaurante
   - 🚗 Marcador animado: Ubicación del repartidor
   - 🏠 Marcador: Dirección de entrega
   - Ruta dibujada entre puntos

---

## ⚡ Mejoras Recomendadas AHORA

### 1. Auto-Asignación Básica
- Asignar al primer repartidor sin entregas activas
- Solo cuando admin marca pedido como "ready"

### 2. Link Visible al Panel de Repartidor
- En header: "Repartidores" → `/driver/dashboard`
- En footer: Link directo

### 3. Panel Admin con Drag & Drop
- Arrastrar pedido sobre repartidor
- Visual intuitivo
- Menos clicks

---

## 🎯 Resumen del Flujo Ideal

```
1. Cliente ordena (delivery) 
   ↓
2. Admin prepara pedido → marca "ready"
   ↓
3. Sistema auto-asigna repartidor disponible
   (o admin asigna manualmente si prefiere)
   ↓
4. Repartidor recibe notificación
   ↓
5. Repartidor abre /driver/dashboard
   ↓
6. Acepta el pedido
   ↓
7. Ubicación se comparte en tiempo real
   ↓
8. Cliente rastrea en /orders/[id]/tracking
   ↓
9. Repartidor marca como "Entregado"
   ↓
10. Orden completada ✅
```

---

## 🔗 Links Importantes

- **Admin:** `https://tudominio.com/admin/dashboard`
- **Delivery:** `https://tudominio.com/admin/delivery`
- **Repartidor:** `https://tudominio.com/driver/dashboard`
- **Tracking:** `https://tudominio.com/orders/[id]/tracking`
- **Configuración MP:** `https://tudominio.com/admin/settings`

---

**¿Quieres que implemente alguna de estas mejoras ahora?**

Opciones:
1. ✅ Sistema de auto-asignación
2. ✅ Link visible al panel de repartidor
3. ✅ Panel admin con drag & drop
4. ✅ Script para crear repartidores fácilmente
5. ✅ Todas las anteriores

**Estado actual:** Sistema funcional pero requiere asignación manual. Todo lo demás está listo (tracking, mapas, notificaciones, etc.)
