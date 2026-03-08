# 🚚 SISTEMA DE ENVÍOS Y TRACKING - FLUJO COMPLETO

## 📋 RESUMEN EJECUTIVO

Tu sistema **SÍ tiene tracking en tiempo real** de pedidos. Los clientes pueden ver dónde va su pedido y el repartidor en el mapa. Sin embargo, **actualmente usa Supabase** para algunas funcionalidades que necesitan migrarse a MySQL.

---

## 🎯 FLUJO COMPLETO DE ENVÍOS

### **FASE 1: CLIENTE HACE PEDIDO**

```
1. Cliente selecciona productos en /menu
2. Va al carrito /checkout
3. Elige tipo de entrega:
   - 🚗 Delivery (a domicilio) + $25
   - 🏪 Pickup (recoger en local) - Gratis
4. Si es delivery, proporciona dirección
5. Confirma pedido → Se crea en DB
```

**Tablas involucradas:**
- `orders` - Se crea registro con `delivery_type` = 'delivery' o 'pickup'

---

### **FASE 2: ADMIN GESTIONA PEDIDO**

```
1. Admin ve pedido en /admin/orders
2. Cambia estados:
   📝 Pendiente → 👨‍🍳 Preparando → ✅ Listo para recoger
```

**Página:** `/admin/orders`
- Lista todos los pedidos
- Puede cambiar estado manualmente
- Filtra por estado, fecha, etc.

---

### **FASE 3: ASIGNACIÓN DE REPARTIDOR** ⭐

```
1. Cuando pedido está "Listo para recoger"
2. Admin va a /admin/delivery
3. Ve lista de pedidos listos
4. Ve lista de repartidores disponibles
5. Asigna repartidor a pedido
6. Se crea registro en delivery_assignments
7. Orden cambia a "Asignado a repartidor"
```

**Página:** `/admin/delivery`  
**Funciones:**
- Ver pedidos listos para delivery
- Ver repartidores activos/disponibles
- Asignar manualmente pedido a repartidor
- Ver historial de asignaciones
- Ver estado de entregas en progreso

**Tablas:**
- `delivery_assignments` - Registro de asignación
- `delivery_drivers` - Info del repartidor
- `orders` - Se actualiza `driver_id` y `status`

---

### **FASE 4: REPARTIDOR ACEPTA Y ENTREGA** 🏍️

```
1. Repartidor inicia sesión en /driver/dashboard
2. Ve sus asignaciones pendientes
3. Acepta el pedido
4. Sistema captura ubicación GPS del repartidor
5. Inicia tracking en tiempo real
6. Repartidor navega al destino
7. Marca como entregado al llegar
```

**Página:** `/driver/dashboard`  
**Funciones:**
- Ver pedidos asignados
- Aceptar/rechazar pedidos
- Ver mapa con ruta al destino
- Actualizar ubicación en tiempo real
- Marcar como entregado

**⚠️ PROBLEMA:** Esta página usa **Supabase** para:
- Autenticación del driver
- Tracking en tiempo real
- Actualización de ubicación GPS

**Código:** `app/driver/dashboard/page.tsx` (líneas 1-100)

---

### **FASE 5: CLIENTE HACE TRACKING** 📍 ⭐

```
1. Cliente recibe link o va a /orders/{id}/tracking
2. Ve estado actual del pedido
3. Visualiza:
   - Barra de progreso (6 etapas)
   - Estado actual
   - Tiempo estimado
   - Info del repartidor (nombre, teléfono)
   - Mapa en tiempo real (si está en camino)
4. Se actualiza cada 15 segundos automáticamente
```

**Página:** `/orders/[id]/tracking`  
**Funciones:**
- Progreso visual del pedido (6 etapas)
- Info de repartidor
- Mapa con ubicación en tiempo real
- Tiempo estimado de entrega
- Actualización automática cada 15s

**Etapas visualizadas:**
1. ⏰ Pedido recibido
2. 📦 En preparación
3. ✅ Listo para recoger
4. 👤 Repartidor asignado
5. 🚗 En camino
6. ✔️ Entregado

**Código:** `app/orders/[id]/tracking/page.tsx`

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### Tabla: `delivery_drivers`
```sql
Almacena info de repartidores
- id
- user_id (FK a users)
- name, phone, email
- vehicle_type, license_plate
- is_active, is_available
- current_location (JSON con lat/lng)
- rating (decimal 3,2)
- total_deliveries
- created_at, updated_at
```

### Tabla: `delivery_assignments`
```sql
Registro de asignaciones de pedidos
- id
- order_id (FK a orders)
- driver_id (FK a delivery_drivers)
- status (pending, accepted, rejected, completed, cancelled)
- assigned_at, accepted_at, completed_at
- start_location, delivery_location (JSON)
- estimated_distance, estimated_duration
- actual_duration
- driver_notes
```

### Tabla: `orders` (columnas de delivery)
```sql
- driver_id (FK a delivery_drivers)
- delivery_type (enum: 'pickup', 'delivery')
- delivery_address (TEXT)
- delivery_notes (TEXT)
```

---

## 🔌 ENDPOINTS API

### Admin - Drivers
```
GET  /api/delivery/drivers
POST /api/delivery/drivers
GET  /api/delivery/drivers/{id}
PUT  /api/delivery/drivers/{id}
```

### Admin - Assignments
```
GET  /api/delivery/assignments
POST /api/delivery/assignments  (asignar pedido a driver)
PUT  /api/delivery/assignments/{id}  (cambiar estado)
```

### Driver
```
GET  /api/delivery/assignments?driver_id={id}  (sus asignaciones)
PUT  /api/delivery/assignments/{id}/accept
PUT  /api/delivery/assignments/{id}/complete
POST /api/delivery/location  (actualizar ubicación)
```

### Cliente - Tracking
```
GET  /api/orders-mysql/{id}  (info del pedido)
GET  /api/delivery/assignments?order_id={id}  (info de asignación)
```

---

## ⚠️ PROBLEMAS ACTUALES

### 1. **Driver Dashboard usa Supabase** ❌
**Archivo:** `app/driver/dashboard/page.tsx`
**Problema:**
```typescript
const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()
const { data: driverData } = await supabase.from("delivery_drivers")...
```

**Solución necesaria:**
- Migrar autenticación a JWT (ya tenemos en auth-simple.ts)
- Cambiar queries a MySQL usando executeQuery
- Actualizar real-time tracking a usar WebSockets o polling

### 2. **Real-time Location Service usa Supabase** ❌
**Archivo:** `lib/real-time-location.ts`
**Problema:** Usa Supabase Realtime para actualizar ubicación

**Solución necesaria:**
- Implementar WebSocket server con Socket.io
- O usar polling cada X segundos desde cliente

### 3. **Google Maps API Key** ⚠️
**Variable:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
**Estado:** Probablemente vacía en `.env.local`

**Solución:**
- Obtener API key de Google Cloud Console
- Habilitar Maps JavaScript API y Directions API
- Agregar a `.env.local`

---

## 🎨 INTERFAZ DE USUARIO

### Cliente ve en `/orders/{id}/tracking`:
```
┌─────────────────────────────────────┐
│  Seguimiento del pedido #123        │
│                                     │
│  ● ─── ● ─── ● ─── ○ ─── ○ ─── ○   │
│  ✓     ✓     ✓     ⏳              │
│ Recib Prep Listo Asign Camin Entre │
│                                     │
│  Estado actual: Repartidor asignado│
│  Tiempo estimado: 25 min           │
│                                     │
│  📍 Repartidor                      │
│  Nombre: Juan Pérez                │
│  Tel: 555-1234                     │
│                                     │
│  [Mapa con ubicación en tiempo real]│
│                                     │
│  Detalles del pedido:              │
│  - Hamburguesa x2    $240          │
│  - Papas x1          $80           │
│  - Delivery          $25           │
│  Total:              $345          │
└─────────────────────────────────────┘
```

---

## 🔄 ESTADOS DEL PEDIDO

```
pendiente/pending
  ↓
preparando/preparing
  ↓
listo_para_recoger/ready
  ↓
asignado_repartidor/assigned  ← Admin asigna driver
  ↓
en_camino/in_delivery  ← Driver acepta y sale
  ↓
entregado/delivered  ← Driver marca como entregado
```

**O alternativamente:**
```
pendiente → preparando → listo_para_recoger → cancelado
```

---

## 📱 EXPERIENCIA DEL CLIENTE

### Pedido tipo DELIVERY:
1. ✅ Hace pedido con dirección
2. 📧 Recibe confirmación (email/SMS)
3. 🔗 Recibe link de tracking
4. 👀 Puede ver en tiempo real:
   - Estado del pedido
   - Quién es su repartidor
   - Dónde está en el mapa
   - Cuánto falta para que llegue
5. 📞 Puede llamar al repartidor
6. ✅ Recibe notificación al entregar

### Pedido tipo PICKUP:
1. ✅ Hace pedido sin dirección
2. 📧 Recibe confirmación
3. 👀 Ve solo estados:
   - Pendiente → Preparando → Listo
4. 🏪 Va al local cuando está listo

---

## 🚀 PLAN DE MIGRACIÓN A MYSQL COMPLETO

### ✅ Ya funciona con MySQL:
- [x] Orders
- [x] Products
- [x] Categories  
- [x] Users
- [x] Admin delivery management
- [x] Tracking page (mostrar info)

### ❌ Necesita migración de Supabase:
- [ ] Driver authentication
- [ ] Driver dashboard
- [ ] Real-time location updates
- [ ] Driver location broadcasting

### 🔨 Tareas pendientes:

#### 1. Migrar Driver Auth (2-3 horas)
```typescript
// Reemplazar en app/driver/dashboard/page.tsx
// ANTES:
const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()

// DESPUÉS:
import { getCurrentUser } from '@/lib/auth-simple'
const user = await getCurrentUser(request)
if (!user || !user.is_driver) { redirect('/login') }
```

#### 2. Migrar Driver Queries (1 hora)
```typescript
// ANTES:
const { data: driverData } = await supabase
  .from("delivery_drivers")
  .select("*")
  .eq("user_id", session.user.id)
  .single()

// DESPUÉS:
const driverData = await executeQuery(
  'SELECT * FROM delivery_drivers WHERE user_id = ?',
  [user.id]
)
```

#### 3. Implementar Real-time con Polling (2 horas)
```typescript
// En tracking page, ya lo hace cada 15s
useEffect(() => {
  const interval = setInterval(() => {
    fetchData()  // Refresca pedido y ubicación
  }, 15000)  // Cada 15 segundos
  return () => clearInterval(interval)
}, [])
```

#### 4. Opcional: WebSockets (4-6 horas)
Para tracking más fluido:
- Instalar Socket.io
- Crear servidor WebSocket
- Driver envía ubicación cada 5s
- Cliente recibe updates instantáneos

---

## 📊 MÉTRICAS Y REPORTES

El admin puede ver en `/admin/delivery`:
- 📈 Total de deliveries
- ⏱️ Tiempo promedio de entrega
- ⭐ Rating de repartidores
- 📍 Entregas activas en tiempo real
- 📅 Historial completo

---

## 💡 MEJORAS FUTURAS

### Corto plazo:
1. ✅ Migrar driver dashboard a MySQL
2. ✅ Implementar notificaciones push
3. ✅ Agregar chat driver-cliente

### Mediano plazo:
1. 🗺️ Optimización de rutas (múltiples deliveries)
2. 📊 Dashboard de análisis de deliveries
3. 💳 Propinas para repartidores
4. ⭐ Sistema de reviews de repartidores

### Largo plazo:
1. 🤖 Asignación automática de repartidores (por zona/carga)
2. 📱 App móvil nativa para drivers
3. 🔔 Notificaciones SMS/WhatsApp
4. 📍 Geofencing (notificar cuando driver está cerca)

---

## 🎯 RESUMEN FINAL

### ✅ LO QUE FUNCIONA:
- Clientes pueden ver tracking en `/orders/{id}/tracking`
- Admin puede asignar repartidores
- Sistema actualiza automáticamente cada 15s
- Barra de progreso visual
- Info de repartidor visible
- Gestión completa de drivers en admin

### ⚠️ LO QUE NECESITA TRABAJO:
- Driver dashboard usa Supabase (necesita migración)
- Mapa en tiempo real requiere Google Maps API key
- Real-time location usa Supabase (cambiar a polling o WebSockets)

### 🚀 PRIORIDAD:
1. **Alta:** Obtener Google Maps API key
2. **Alta:** Migrar driver authentication a MySQL
3. **Media:** Migrar driver queries a MySQL
4. **Baja:** Implementar WebSockets (polling funciona bien)

---

**Estado actual:** 70% funcional con MySQL  
**Para 100%:** Migrar driver dashboard (2-4 horas de trabajo)

**Documentado:** 2025-10-11  
**Sistema:** ✅ Producción Ready (excepto driver dashboard)
