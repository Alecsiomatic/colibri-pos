# ANÁLISIS COMPLETO DEL SISTEMA - Colibrí-REST

**Fecha de Análisis:** 7 de Marzo, 2026  
**Versión del Sistema:** 0.1.0  
**Framework:** Next.js 14.2.18 + React 19 + MySQL  
**Repositorio:** https://github.com/Alecsiomatic/colibri-pos.git

---

## ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura General](#2-arquitectura-general)
3. [Módulos del Sistema](#3-módulos-del-sistema)
4. [Base de Datos](#4-base-de-datos)
5. [API Reference](#5-api-reference)
6. [Hooks y Estado](#6-hooks-y-estado)
7. [Componentes](#7-componentes)
8. [Seguridad](#8-seguridad)
9. [Inventario de Archivos Muertos/Vacíos](#9-inventario-de-archivos-muertosvacíos)
10. [Hallazgos Críticos](#10-hallazgos-críticos)

---

## 1. RESUMEN EJECUTIVO

Colibrí-REST es un sistema POS (Point of Sale) completo para restaurantes construido con Next.js 14. Incluye:

- **6 módulos principales:** Caja, Mesero, Driver, Kiosko, Admin, Menú Cliente
- **108 rutas API** REST
- **49 componentes** custom (38 funcionales, 11 vacíos/rotos)
- **11 hooks** personalizados (2 vacíos)
- **23 librerías** en /lib
- **20+ tablas** en base de datos MySQL
- **23 páginas** de administración

### Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Tailwind CSS, Radix UI (shadcn/ui) |
| Framework | Next.js 14.2.18 (App Router) |
| Base de Datos | MySQL (MariaDB) en Hostinger (srv440.hstgr.io) |
| Autenticación | JWT custom (simple-jwt.ts) + Sessions en DB |
| Mapas | Leaflet + OpenStreetMap + OSRM (gratis) + Google Maps (opcional) |
| Pagos | MercadoPago |
| AI | OpenAI GPT-4o (chatbot WhatsApp) |
| Impresión | Servidor USB propio + Raspberry Pi |
| Deploy | PM2 + Nginx en VPS Debian 13 (187.77.3.106) |

---

## 2. ARQUITECTURA GENERAL

### Diagrama de Flujo

```
┌──────────────────────────────────────────────────────────────┐
│                       CLIENTES                                │
│  Browser → Kiosko → WhatsApp → QR Code → App Mesero         │
└──────────────┬───────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────┐
│                    MIDDLEWARE (middleware.ts)                  │
│  JWT Validation → Role Check (Admin/Driver/Waiter/Customer)  │
└──────────────┬───────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────┐
│                    NEXT.JS APP ROUTER                         │
│                                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐          │
│  │  /caja  │ │ /mesero │ │ /driver │ │  /admin  │          │
│  │  (POS)  │ │ (Waiter)│ │(Deliver)│ │(Dashboard│          │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬─────┘          │
│       │           │           │            │                  │
│  ┌────▼───────────▼───────────▼────────────▼─────┐          │
│  │              /api/* (108 endpoints)            │          │
│  └──────────────────┬────────────────────────────┘          │
└─────────────────────┼────────────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────────────┐
│                    lib/ (Servicios)                            │
│                                                               │
│  auth.ts ─── mysql-db.ts ─── delivery-service.ts             │
│  auth-mysql.ts   db.ts       order-processor.ts              │
│  simple-jwt.ts   db-retry.ts product-service.ts              │
│                              stock-service.ts                 │
│                              maps-free.ts                     │
│                              whatsapp-message-processor.ts    │
└─────────────────────┬────────────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────────────┐
│              MySQL (srv440.hstgr.io)                          │
│              DB: u191251575_colibridemo                       │
│              20+ tablas                                       │
└──────────────────────────────────────────────────────────────┘
```

### Jerarquía de Providers (layout.tsx)

```
<html lang="es">
  <body>
    <ThemeProvider>           ← Dark/Light mode
      <AuthProvider>          ← User session, login/logout
        <NotificationProvider> ← Toasts y alertas
          <CartProvider>       ← Carrito de compras
            {children}
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  </body>
</html>
```

### Flujo de Autenticación

```
Login → POST /api/auth/login-mysql
  → authenticateUser() (bcrypt compare)
  → generateTokens() (access 15min + refresh 7d)
  → createSession() (guarda en user_sessions)
  → Set cookie "auth-token" (httpOnly)
  → Redirect según rol:
      Admin    → /admin/dashboard
      Driver   → /driver/dashboard
      Mesero   → /mesero/mesas-abiertas
      Cliente  → /demo
```

---

## 3. MÓDULOS DEL SISTEMA

### 3.1 MÓDULO CAJA (POS) — `/caja`

**Propósito:** Terminal punto de venta para crear pedidos manuales, administrar turnos y cobros.

**Páginas:**
| Ruta | Función |
|------|---------|
| `/caja` | Terminal POS principal |
| `/caja/cierre/[id]` | Cierre y conciliación de turno |

**Funcionalidades:**
- Requiere turno activo para vender
- Búsqueda de productos por nombre + filtro por categoría
- Carrito con controles de cantidad
- Soporte para modificadores de producto
- Métodos de pago: efectivo (con cálculo de cambio) y tarjeta
- Tabs: Venta, Kiosko (pedidos pendientes), Online, Estadísticas
- Auto-refresh cada 30s de pedidos pendientes
- Cierre de turno con conciliación de caja (esperado vs real)

**APIs consumidas:**
- `GET /api/shifts?status=open` — Verificar turno activo
- `POST /api/shifts` — Abrir nuevo turno
- `GET /api/products-mysql?available=true` — Cargar productos
- `GET /api/categories` — Cargar categorías
- `POST /api/orders-mysql` — Crear pedido
- `PATCH /api/orders-mysql/{id}` — Actualizar estado
- `GET /api/shifts/{id}/stats` — Estadísticas del turno

---

### 3.2 MÓDULO MESERO — `/mesero`

**Propósito:** Dashboard para meseros con gestión de mesas abiertas, toma de pedidos y cobros de mesa.

**Páginas:**
| Ruta | Función |
|------|---------|
| `/mesero/mesas-abiertas` | Dashboard de mesas abiertas |
| `/mesero/ticket/[id]` | Visualización de ticket individual |
| `/checkout/mesero` | Checkout especial para ordenes de mesa |

**Funcionalidades:**
- Lista de mesas abiertas con items expandibles
- Impresión de tickets (servidor térmico o browser print como fallback)
- Cierre de mesa con payment modal (efectivo con cambio, tarjeta)
- Creación de pedidos asociados a mesa
- Pedidos se acumulan en la misma mesa (merge si open_table existente)
- Generación de HTML para ticket térmico (80mm de ancho)

**APIs consumidas:**
- `GET /api/mesero/open-tables` — Mesas con pedidos abiertos
- `GET /api/admin/business-info` — Info del negocio para tickets
- `POST /api/print` — Envío a impresora térmica
- `POST /api/close-table-payment` — Cierre de mesa con pago
- `POST /api/orders-mysql` — Nuevo pedido (vía useCart)

---

### 3.3 MÓDULO DRIVER (Repartidor) — `/driver`

**Propósito:** Dashboard móvil para repartidores con GPS en tiempo real, rutas y gestión de entregas.

**Páginas:**
| Ruta | Función |
|------|---------|
| `/driver/dashboard` | Panel principal del repartidor |

**Funcionalidades:**
- Autenticación de driver con verificación `is_driver`
- Mapa de ruta con Leaflet (OpenStreetMap + OSRM)
- Tracking GPS continuo (navigator.geolocation.watchPosition)
- Lista de asignaciones pendientes y activas
- Aceptar/Completar entregas
- Cálculo de ruta con distancia y duración
- Botón "Llamar cliente" (tel: link)
- Enlace a Google Maps para navegación

**APIs consumidas:**
- `GET /api/driver/me` — Autenticar driver
- `GET /api/driver/assignments` — Entregas asignadas
- `POST /api/driver/assignments/{id}/accept` — Aceptar entrega
- `POST /api/driver/assignments/{id}/complete` — Marcar como entregado
- `POST /api/driver/location/update` — Enviar ubicación GPS
- `GET /api/restaurant-config` — Coordenadas del restaurante
- `POST /api/calculate-route` — Cálculo de ruta OSRM

---

### 3.4 MÓDULO KIOSKO — `/kiosk`

**Propósito:** Pantalla táctil de auto-servicio para pedidos sin mesero.

**Páginas:**
| Ruta | Función |
|------|---------|
| `/kiosk` | Terminal de auto-servicio |

**Funcionalidades:**
- Pantalla completa (fullscreen) si está configurado
- WelcomeBubblyPanel con burbujas de categoría animadas
- Targets táctiles grandes para accesibilidad
- Soporte para modificadores de producto
- Animación flyingImage al agregar al carrito
- Carrito flotante con modal de checkout
- Captura nombre del cliente y método de pago
- Configurable vía kiosk_settings en BD

**APIs consumidas:**
- `GET /api/products-mysql?available=true`
- `GET /api/categories`
- `GET /api/kiosk/settings`
- `POST /api/orders` (vía useCart)

---

### 3.5 MÓDULO MENÚ CLIENTE — `/menu`

**Propósito:** Menú público para que clientes naveguen productos, agreguen al carrito y hagan checkout.

**Páginas:**
| Ruta | Función |
|------|---------|
| `/menu` | Catálogo de productos |
| `/checkout` | Finalización de pedido (delivery/pickup) |
| `/checkout/mesero` | Checkout para meseros |
| `/orders` | Historial de pedidos |
| `/orders/thank-you` | Confirmación de pedido |
| `/orders/[orderId]` | Detalle del pedido |
| `/orders/[orderId]/tracking` | Tracking de delivery en vivo |

**Funcionalidades:**
- Categorías con conteo de productos
- Grid responsivo de productos con imágenes
- Modal de modificadores para personalización
- Checkout con opciones delivery/pickup
- Autocompletado de dirección con Nominatim (OpenStreetMap)
- Cálculo de costo de envío en tiempo real
- Integración MercadoPago para pagos con tarjeta
- Tracking en tiempo real con mapa y auto-refresh 10s

---

### 3.6 MÓDULO QR — `/qr/[token]`

**Propósito:** Pedidos desde la mesa vía código QR.

**Funcionalidades:**
- Validación de token QR vs tabla `table_qr_codes`
- Menú de productos con carrito inline
- Ingreso de nombre y teléfono
- Pedidos se crean con order_source='qr'
- Permite múltiples pedidos desde el mismo QR
- UI diferenciada para QR inválido

---

### 3.7 MÓDULO ADMIN — `/admin/*`

**Propósito:** Panel administrativo completo para gestión del restaurante.

**23 sub-módulos:**

| Ruta | Función | Tipo |
|------|---------|------|
| `/admin/dashboard` | Dashboard con métricas | Solo lectura |
| `/admin/orders` | Gestión de pedidos | CRUD completo |
| `/admin/products` | Catálogo de productos | CRUD completo |
| `/admin/categories` | Categorías de menú | CRUD completo |
| `/admin/modificadores` | Modificadores/extras | CRUD completo |
| `/admin/users` | Gestión de usuarios | CRUD completo |
| `/admin/delivery` | Drivers y asignaciones | CRUD completo |
| `/admin/driver-stats` | Estadísticas de drivers | Solo lectura |
| `/admin/inventory` | Inventario con movimientos | CRUD |
| `/admin/inventory-dashboard` | Vista rápida de inventario | Solo lectura |
| `/admin/stock/*` | Utilidades avanzadas de stock | Herramientas |
| `/admin/reportes` | Reportes de ventas y turnos | Solo lectura |
| `/admin/configuracion-empresa` | Info del negocio y logo | Configuración |
| `/admin/restaurant-config` | Coordenadas y delivery fees | Configuración |
| `/admin/settings` | MercadoPago y pagos | Configuración |
| `/admin/featured-products` | Productos destacados | Toggle |
| `/admin/update-images` | Sync imágenes ↔ BD | Herramienta |
| `/admin/fix-permissions` | Reparar permisos | Herramienta |
| `/admin/reset-system` | Reset completo del sistema | Herramienta peligrosa |
| `/admin/migrate-drivers` | Migrar tabla de drivers | Migración |
| `/admin/migrate-add-is-driver` | Agregar columna is_driver | Migración |
| `/admin/database/*` | Utilidades de BD (check, fix) | Herramientas |
| `/admin/debug/*` | Debug auth, stock, modifiers | Herramientas |

**Dashboard muestra:**
- Ingresos totales, hoy, semana, promedio
- Pedidos por estado (pendiente, confirmado, preparando, listo, en camino, entregado, cancelado)
- Productos totales, activos, bajo stock
- Conteo de usuarios

---

### 3.8 MÓDULO LANDING — `/landing`

**Propósito:** Página de marketing del producto SaaS con calculadora de precios.

**Funcionalidades:**
- 12 features con íconos
- 3 planes de precios (Básico, Profesional, Empresarial)
- Calculadora de costos interactiva (central, kiosko, cocina, delivery, dashboard)
- Testimonios
- Botones de acceso rápido por rol (admin, cajero, mesero, driver)

---

### 3.9 MÓDULO CHAT / WHATSAPP

**Propósito:** Chatbot inteligente con IA para pedidos por WhatsApp.

**Flujo de conversación (State Machine):**
```
initial → (usuario escribe "LLAMAME")
  → collecting_name → (obtiene nombre)
    → collecting_address → (obtiene dirección)
      → confirming_order → (confirma con "SI")
        → completed → (notificación al admin)
          → initial
```

**Para mensajes normales:**
- OpenAI GPT-4o genera recomendaciones basadas en el catálogo real de productos
- Categoriza productos automáticamente
- Detecta intención de pedido y cantidad de personas

---

### 3.10 MÓDULO IMPRESIÓN

**Propósito:** Servidor de impresión para tickets térmicos.

**Componentes:**
- `print-server-raspberry/` — Servidor para Raspberry Pi
- `usb-printserver/` — Servidor para conexión USB directa
- `POST /api/print-ticket` — API intermediaria

**Flujo:**
```
App → POST /api/print-ticket → POST {PRINT_SERVER_URL}/print → Impresora térmica
```

---

## 4. BASE DE DATOS

### 4.1 Diagrama de Relaciones

```
                    ┌──────────────────┐
                    │      users       │
                    │   (id, email,    │
                    │    password,     │
                    │    roles)        │
                    └────┬──┬──┬──┬───┘
                         │  │  │  │
          ┌──────────────┘  │  │  └────────────────┐
          │                 │  │                    │
          ▼                 │  ▼                    ▼
┌─────────────────┐        │ ┌──────────────┐ ┌──────────────┐
│ delivery_drivers│        │ │  cash_shifts  │ │   payments   │
│  (driver info,  │        │ │  (turnos de   │ │  (cobros de  │
│   location)     │        │ │    caja)      │ │    mesa)     │
└────────┬────────┘        │ └──────┬───────┘ └──────────────┘
         │                 │        │
         ▼                 ▼        ▼
┌─────────────────┐  ┌──────────┐  ┌──────────────────┐
│    delivery_     │  │  orders  │◄─┤ cash_transactions │
│   assignments    │◄─┤ (JSON    │  └──────────────────┘
│  (asignaciones)  │  │  items)  │
└─────────────────┘  └────┬─────┘
                          │
    ┌──────────┐          │         ┌────────────────┐
    │categories│──┐       │    ┌───▶│table_qr_codes  │
    └──────────┘  │       │    │    └────────────────┘
                  ▼       │    │
              ┌────────┐  │    │    ┌────────────────┐
              │products│──┘    └───▶│  table_history  │
              └───┬────┘            └────────────────┘
                  │
    ┌─────────────┼──────────────┐
    ▼             ▼              ▼
┌──────────┐ ┌────────────┐ ┌───────────────────┐
│ product_ │ │ modifier_  │ │    inventory_      │
│modifiers │ │  groups    │ │    movements       │
└──────────┘ └─────┬──────┘ └───────────────────┘
                   │
                   ▼
             ┌────────────────────┐
             │product_modifier_   │
             │     groups         │
             └────────────────────┘
```

### 4.2 Tablas Principales (20+)

| Tabla | Propósito | Registros típicos |
|-------|-----------|-------------------|
| **users** | Cuentas de usuario (admin, driver, waiter, customer) | Decenas |
| **user_sessions** | Sesiones JWT activas | Decenas |
| **categories** | Categorías del menú | 4-10 |
| **products** | Productos/items del menú | 20-200 |
| **product_modifiers** | Modificadores legacy por producto | Variable |
| **modifier_groups** | Grupos de modificadores (Tamaño, Extras) | 5-20 |
| **product_modifier_groups** | Asignación grupo↔producto | Variable |
| **orders** | Pedidos (JSON items) | Cientos-Miles |
| **delivery_drivers** | Info de repartidores | 1-20 |
| **delivery_assignments** | Asignación pedido→driver | Variable |
| **payments** | Cobros de mesa | Variable |
| **table_history** | Historial de apertura/cierre de mesas | Variable |
| **cash_shifts** | Turnos de caja | Diario |
| **cash_transactions** | Transacciones por turno | Variable |
| **inventory** | Inventario por producto | Por producto |
| **inventory_movements** | Log de movimientos de stock | Variable |
| **table_qr_codes** | Códigos QR para mesas | Por mesa |
| **kiosk_settings** | Config del kiosko (key-value) | ~10 |
| **business_info** | Info del negocio, API keys, features | 1 |
| **system_settings** | Configuración del sistema | ~5 |
| **restaurant_config** | Config de restaurante, delivery fees | 1 |
| **chat_conversations** | Conversaciones WhatsApp | Variable |
| **chat_messages** | Mensajes de chat | Variable |
| **payment_terminal_config** | Config de terminal de pago | 1-3 |

### 4.3 Campos JSON Importantes

Los pedidos almacenan items como JSON en `orders.items`:
```json
[
  {
    "id": 1,
    "name": "Hamburguesa Clásica",
    "price": 120.00,
    "quantity": 2,
    "modifiers": [
      {"name": "Extra queso", "price": 15.00}
    ]
  }
]
```

La información del cliente va en `orders.customer_info`:
```json
{
  "name": "Juan Pérez",
  "phone": "+52 123 456 7890",
  "email": "juan@email.com"
}
```

### 4.4 Vistas y Triggers

**Vista `active_shifts`:** Turnos abiertos con conteo de pedidos y duración.

**Vista `shift_statistics`:** Rendimiento de turnos con ticket promedio.

**Trigger `update_shift_on_order_insert`:** Al insertar pedido, actualiza automáticamente totales del turno.

**Trigger `update_shift_on_order_update`:** Al cancelar pedido, revierte totales del turno.

---

## 5. API REFERENCE

### 5.1 Resumen de Endpoints (108 total)

| Módulo | Endpoints | Auth Requerida |
|--------|-----------|----------------|
| Auth (login, register, logout) | 3 | No |
| Users (profile, password, CRUD) | 8 | Sí |
| Orders MySQL (CRUD, assign, status) | 8 | Mixto |
| Orders Legacy | 4 | Sí |
| Products MySQL (CRUD, featured) | 6 | Admin para writes |
| Products Legacy | 2 | No |
| Categories (CRUD) | 7 | Admin para writes |
| Modifiers (CRUD, assign) | 9 | No (!) |
| Shifts/Cash (CRUD, stats) | 6 | No (!) |
| Driver (assignments, location) | 9 | Driver |
| Delivery (drivers, assignments, cost) | 6 | Admin |
| Admin (users, settings, reports) | 20+ | Admin |
| Maps/Routes | 5 | No |
| Payment (MercadoPago, table close) | 3 | Mixto |
| Chat/WhatsApp | 2 | No |
| Upload (images, logo) | 3 | Admin |
| QR Tables | 3 | No |
| Kiosk | 2 | No |
| Reports | 4 | Mixto |
| Debug | 5 | No |
| Print | 1 | No |
| Register/Create Admin | 2 | No |

### 5.2 Endpoints Críticos

#### Crear Pedido: `POST /api/orders-mysql`
```
Body: {
  items: [{id, quantity, name, price, modifiers}],
  customer_info: {name, phone, email},
  delivery_address: {address, lat, lng},
  payment_method: "efectivo"|"tarjeta"|"mercadopago",
  notes: string,
  waiter_order: boolean,
  table: string,
  order_source: "web"|"kiosk"|"qr"|"admin"|"waiter",
  shift_id: number,
  cash_received: number,
  change_given: number
}
```
**Lógica de negocio:**
- Valida disponibilidad y stock de productos
- Para pedidos de mesero: busca orden open_table existente y mergea items
- Asocia al shift_id y crea cash_transaction
- Maneja campos específicos por método de pago

#### Cierre de Mesa: `POST /api/close-table-payment`
```
Body: {
  tableId: string,
  paymentMethod: "efectivo"|"tarjeta",
  amountPaid: number,
  totalAmount: number
}
```
**Transacción SQL:**
1. SELECT pedidos de la mesa (status in open_table, confirmed, etc.)
2. UPDATE todos a status='paid'
3. INSERT en payments
4. INSERT en table_history
5. COMMIT o ROLLBACK

#### Asignar Driver: `POST /api/orders-mysql/[orderId]/assign-driver`
```
Body: { driverId: number }
```
- Busca driver en delivery_drivers o users con is_driver=1
- Crea delivery_assignment con status='pending'
- Actualiza order status a "assigned_to_driver"

---

## 6. HOOKS Y ESTADO

### 6.1 Hooks Principales

| Hook | Propósito | Estado Global | APIs |
|------|-----------|---------------|------|
| `useAuth` | Login, register, logout, session check | Sí (Context) | 4 endpoints |
| `useCart` | Carrito con localStorage sync | Sí (Context) | 1 endpoint |
| `useProducts` | Catálogo con CRUD admin | No (local) | 5 endpoints |
| `useOrders` | Pedidos con backoff retry | No (local) | 6 endpoints |
| `useNotifications` | Sistema de toasts y alertas | Sí (Context) | Ninguno |
| `useToast` (simple) | Convenience wrapper sobre notifications | Via Context | Ninguno |
| `useToast` (shadcn) | Toast a nivel UI framework | Global (sin Context) | Ninguno |
| `useAddressValidation` | Validación de dirección Google Maps | No (local) | 2 endpoints |
| `useMobile` | Detección viewport < 768px | No (local) | Ninguno |
| `useWindowSize` | Dimensiones del viewport | No (local) | Ninguno |
| `useSafeDate` | **VACÍO** | — | — |
| `useSafeNumber` | **VACÍO** | — | — |

### 6.2 Flujo de Estado

```
useAuth (Context global)
  ├── useProducts (consume user.is_admin)
  ├── useOrders (consume user.is_admin)
  └── useToast (notifica errores)

useCart (Context global)
  └── Standalone (localStorage)

useNotifications (Context global)
  └── Standalone (localStorage)
```

### 6.3 Patrones Notables en Hooks

- **Retry con exponential backoff:** `useProducts` y `useOrders` implementan reintentos (500ms, 1000ms, 2000ms)
- **Concurrency prevention:** `useProducts` usa useRef para evitar fetches paralelos
- **Toast throttling:** Máximo 1 toast de error cada 5 segundos
- **Backoff window:** `useOrders` espera 30s después de un fetch fallido antes de reintentar
- **Auto-refresh:** `useOrders` auto-fetch al cambiar usuario

---

## 7. COMPONENTES

### 7.1 Inventario de Componentes (49 total)

| Categoría | Componentes | Funcionales | Vacíos/Rotos |
|-----------|-------------|-------------|--------------|
| Root (raíz) | 13 | 11 | 2 |
| Admin | 7 | 7 | 0 |
| Animaciones | 1 | 1 | 0 |
| Auth | 4 | 4 | 0 |
| Cart | 3 | 3 | 0 |
| Debug | 1 | 1 | 0 |
| Driver | 1 | 1 | 0 |
| Kiosk | 3 | 3 | 0 |
| Layout | 5 | 5 | 0 |
| Maps | 4 | 3 | 1 (corrupto) |
| Menu | 5 | 5 | 0 |
| Notifications | 2 | 2 | 0 |
| **UI (shadcn)** | **55** | **55** | **0** |

### 7.2 Componentes Clave

**ProductModifierModal** (~400 LOC) — Modal avanzado de personalización:
- Carga modifier_groups con opciones dinámicas
- Radio buttons para selección única, checkboxes para múltiple
- Validación de grupos requeridos
- Precio dinámico por modificador

**DeliveryMap** (~250 LOC) — Mapa de tracking:
- Leaflet con tiles OpenStreetMap
- Markers custom con emojis (🚗 driver, 🏪 restaurante, 📍 entrega)
- Auto-fit de bounds
- Polyline de ruta

**WelcomeBubblyPanel** (~400 LOC) — Selector de categorías animado:
- Burbujas con animación CSS
- Iconos dinámicos de lucide-react
- 3 modos: mobile, desktop, kiosk

**CashMovementModal** (~200 LOC) — Movimientos de caja:
- Registra depósitos y retiros
- Validación de monto > 0
- Notas obligatorias

**CollectPaymentModal** (~300 LOC) — Cobro en mesa:
- Efectivo con cálculo de cambio
- Tarjeta con confirmación
- Detección automática de pedidos ya pagados

### 7.3 Componentes Vacíos/Rotos

| Componente | Estado |
|-----------|--------|
| `AuthInterceptor.tsx` | VACÍO |
| `client-only.tsx` | VACÍO |
| `TableManagementSystem.tsx` | VACÍO |
| `TableUnification.tsx` | VACÍO |
| `real-time-tracking-map.tsx` | CORRUPTO (código duplicado) |

---

## 8. SEGURIDAD

### 8.1 Evaluación de Riesgos

| Área | Riesgo | Descripción |
|------|--------|-------------|
| **Middleware JWT** | 🔴 ALTO | No verifica firma del JWT - solo valida formato y expiración. Un atacante podría forjar tokens modificando el payload base64 |
| **auth-simple.ts** | 🔴 ALTO | Usa base64 encoding (NO es encriptación). Credenciales decodificables sin clave |
| **API /api/modifiers** | 🟡 MEDIO | Sin autenticación - cualquiera puede crear/modificar/eliminar modificadores |
| **API /api/shifts** | 🟡 MEDIO | Sin autenticación - cualquiera puede abrir/cerrar turnos |
| **API /api/create-admin** | 🔴 ALTO | Endpoint público que crea usuario admin con credenciales conocidas (admin123) |
| **next.config.mjs** | 🟡 MEDIO | TypeScript y ESLint deshabilitados en build - errores pasan a producción |
| **Google Maps API key** | 🟡 MEDIO | useAddressValidation expone key en cliente (debería proxiarse por API) |
| **API routes sin auth** | 🟡 MEDIO | Múltiples rutas API no verifican autenticación (kiosk, modifiers, shifts, reports) |
| **Console logging** | 🟢 BAJO | Middleware logea tokens truncados e IDs de usuario |

### 8.2 Buenas Prácticas Implementadas

- ✅ Passwords hasheados con bcrypt (12 rounds)
- ✅ Queries parametrizadas (previenen SQL injection)
- ✅ Cookies httpOnly para tokens
- ✅ Sesiones persistidas en BD con expiración
- ✅ Refresh tokens con rotación
- ✅ Roles RBAC (admin, driver, waiter, customer)
- ✅ Detección de duplicados (email, username)
- ✅ Validación de archivos en upload (tipo MIME, tamaño máximo)
- ✅ Transacciones SQL para operaciones multi-tabla

---

## 9. INVENTARIO DE ARCHIVOS MUERTOS/VACÍOS

### 9.1 Archivos Vacíos en el Sistema

| Archivo | Tipo |
|---------|------|
| `hooks/use-safe-date.tsx` | Hook sin implementar |
| `hooks/use-safe-number.tsx` | Hook sin implementar |
| `components/AuthInterceptor.tsx` | Componente sin implementar |
| `components/client-only.tsx` | Componente sin implementar |
| `components/TableManagementSystem.tsx` | Componente sin implementar |
| `components/TableUnification.tsx` | Componente sin implementar |
| `app/api/mesero/mesas-abiertas/route.ts` | API sin implementar |
| `app/api/mesero/division-cuentas/route.ts` | API sin implementar |
| `app/api/mesero/cuentas-separadas/route.ts` | API sin implementar |
| `app/api/debug/cookies/route.ts` | API sin implementar |

### 9.2 Código Duplicado/Legacy

| Archivo | Descripción |
|---------|-------------|
| `lib/auth.ts` | Sistema auth principal |
| `lib/auth-simple.ts` | Auth legacy con base64 (redundante) |
| `lib/auth-mysql.ts` | Auth avanzada con sessions |
| `lib/auth-migration.ts` | Migración a Supabase (ya no aplica) |
| `lib/db.ts` | Wrapper DB principal |
| `lib/db-init.ts` | Init SQLite (ya no se usa) |
| `lib/db-functions.ts` | Stock functions |
| `lib/memory-store.ts` | Store en memoria (ya no se usa) |
| `lib/stock-service.ts` | Stock vía Supabase (ya no se usa) |
| `lib/real-time-location.ts` | Tracking vía Supabase (ya no se usa) |
| `middleware-backup.ts` | Backup del middleware |
| `middleware-mysql.ts` | Versión MySQL del middleware |
| `app/caja/page-test.tsx` | Página de test |
| `app/caja/page-vps.tsx` | Versión VPS |
| `app/caja/page.tsx.backup` | Backup |
| `app/caja/page.tsx.backup.vps` | Backup VPS |
| `app/caja/page.tsx.broken` | Versión rota |
| `app/landing/page.tsx.backup` | Backup |
| `app/landing/page.tsx.bak` | Backup |
| `app/menu/MenuPageClient-old.tsx` | Versión vieja |

### 9.3 Scripts Sueltos en Raíz (60+ archivos)

La raíz del proyecto contiene **60+ scripts** de mantenimiento, debug, migración y testing que deberían organizarse o eliminarse:

```
check-*.js (8 archivos)    — Scripts de verificación
create-*.js (13 archivos)  — Scripts de creación
test-*.js (15 archivos)    — Scripts de testing
fix-*.js (2 archivos)      — Scripts de corrección
debug-*.js (2 archivos)    — Scripts de debug
*.md (30+ archivos)        — Documentación dispersa
```

### 9.4 Sistemas Duales/Redundantes

| Funcionalidad | Sistema 1 | Sistema 2 | Usado |
|--------------|-----------|-----------|-------|
| Auth | auth.ts + auth-mysql.ts | auth-simple.ts (base64) | Sistema 1 |
| DB | mysql-db.ts (MySQL) | memory-store.ts (RAM) | MySQL |
| DB Init | db-init.ts (SQLite) | mysql-db.ts + scripts | MySQL |
| Stock | db-functions.ts (MySQL) | stock-service.ts (Supabase) | MySQL |
| Location | lib/delivery-service.ts | real-time-location.ts (Supabase) | delivery-service |
| Toasts | use-notifications.tsx | use-toast.ts (shadcn) | Ambos (conflicto) |
| Orders API | /api/orders/ | /api/orders-mysql/ | orders-mysql |
| Products API | /api/products/ | /api/products-mysql/ | products-mysql |
| Maps | google-maps.ts | maps-free.ts (OSM) | maps-free |

---

## 10. HALLAZGOS CRÍTICOS

### 10.1 Problemas de Seguridad

1. **JWT sin verificación de firma en middleware** — El middleware solo valida formato base64 y expiración, NO la firma HMAC. Esto permite forjar tokens.

2. **Endpoint /api/create-admin público** — Cualquiera puede crear un admin con credenciales conocidas (admin@supernova.com / admin123).

3. **APIs sin autenticación** — modifiers, shifts, kiosk settings, reports pueden ser accedidos sin login.

4. **auth-simple.ts usa base64** — Las credenciales son decodificables sin clave secreta.

### 10.2 Problemas de Arquitectura

5. **Sistemas duales everywhere** — Auth, DB, stock, orders, products, maps, toasts... hay dos implementaciones de casi todo. Solo una se usa realmente.

6. **60+ scripts sueltos en raíz** — check-*.js, create-*.js, test-*.js sin organización.

7. **30+ archivos .md de documentación** — Dispersos en la raíz, muchos obsoletos.

8. **5 archivos de backup** — page.tsx.backup, .bak, .broken, -old.tsx en rutas de app.

9. **Código Supabase residual** — lib/real-time-location.ts, lib/stock-service.ts, lib/auth-migration.ts refieren a Supabase que ya no se usa.

### 10.3 Problemas de Código

10. **TypeScript y ESLint deshabilitados en build** — `ignoreBuildErrors: true` y `ignoreDuringBuilds: true` permiten que errores pasen a producción.

11. **Imágenes sin optimizar** — `images: { unoptimized: true }` en next.config desactiva la optimización de Next.js Image.

12. **Dependencias con "latest"** — package.json usa versiones "latest" que son impredecibles.

13. **Toast duplicado** — Dos sistemas de toast (useNotifications y use-toast) con el mismo nombre `useToast`, causando ambigüedad.

14. **Comparación de modificadores frágil** — useCart usa `JSON.stringify()` para comparar modifiers (el orden de propiedades puede variar).

15. **10+ componentes/hooks vacíos** — Placeholders sin implementar que agregan confusión.

### 10.4 Problemas de Base de Datos

16. **Datos duplicados en business_info** — Columnas `name` y `business_name`, `phone` y `business_phone`, etc.

17. **Dos tablas de assignments** — `delivery_assignments` y `driver_assignments` con propósito similar.

18. **Items como JSON** — `orders.items` almacena productos como JSON sin validación a nivel BD.

19. **Status inconsistentes** — Mezcla de español (pendiente, preparando) e inglés (pending, confirmed) en enums de status.

### 10.5 Problemas de UX/Performance

20. **TOAST_LIMIT = 1** — Solo muestra 1 toast a la vez (use-toast.ts shadcn).

21. **No hay caché de API key** — useAddressValidation hace fetch de business-info en CADA validación.

22. **Background image fijo** — `resta.png` como background-attachment: fixed afecta performance en móvil.

23. **Single instance PM2** — No hay clustering ni load balancing.

---

## RESUMEN ESTADÍSTICO FINAL

| Métrica | Valor |
|---------|-------|
| **Archivos TypeScript/TSX** | ~200 |
| **Archivos JavaScript** | ~80 (scripts) |
| **Rutas API** | 108 |
| **Páginas** | 35 |
| **Componentes Custom** | 49 (38 funcionales) |
| **Componentes UI (shadcn)** | 55 |
| **Hooks** | 11 (9 funcionales) |
| **Librerías (lib/)** | 23 |
| **Tablas BD** | 20+ |
| **Scripts Raíz** | 60+ |
| **Docs .md Raíz** | 30+ |
| **NPM Dependencies** | 70+ |
| **LOC Estimado** | ~25,000-30,000 |

---

*Documento generado como análisis exhaustivo del sistema Colibrí-REST. Este documento es solo de diagnóstico — no incluye propuestas de mejora.*
