# 📍 Cómo el Cliente Ve el Tracking de su Pedido

## 🛣️ Flujo Completo del Cliente

### 1️⃣ Realizar Pedido
**Ruta:** `/checkout`

El cliente:
1. Completa el formulario con sus datos
2. Selecciona método de pago (efectivo o tarjeta)
3. Hace clic en "Finalizar Pedido"
4. Es redirigido automáticamente a la página de agradecimiento

---

### 2️⃣ Página de Agradecimiento
**Ruta:** `/orders/thank-you?orderId=[id]`

**Elementos visibles:**
- 🎉 Animación de confetti (5 segundos)
- ✅ Mensaje de confirmación
- 💳 Estado del pago (Pagado/Pendiente/Efectivo)
- 📋 Número de orden
- 📍 3 pasos del proceso:
  1. Confirmación recibida
  2. Preparación del pedido
  3. Entrega en camino
- 🔗 Botón "Ver Estado del Pedido"

**Código del componente:**
```typescript
// app/orders/thank-you/page.tsx
- Confetti con react-confetti (dynamic import)
- Estado del pago con badges
- Link a /orders/[id]
```

---

### 3️⃣ Ver "Mis Pedidos"
**Ruta:** `/orders`

**Vista:**
```
┌────────────────────────────────────────┐
│  Mis Pedidos                           │
├────────────────────────────────────────┤
│  Pedido #1234          [Estado: listo] │
│  $25.900                    12:30 PM   │
│                                        │
│  [Ver Detalles]                        │
└────────────────────────────────────────┘
```

**Estados posibles:**
- 🟡 `pendiente` - Esperando confirmación
- 🔵 `confirmado` - Pedido confirmado
- 📦 `procesando` - Preparando pedido
- ✅ `listo` - Listo para recoger/enviar
- 👤 `asignado` - Repartidor asignado
- 🚚 `en camino` - En ruta de entrega
- ✅ `entregado` - Entregado
- ❌ `cancelado` - Cancelado

---

### 4️⃣ Detalles del Pedido
**Ruta:** `/orders/[id]`

**Secciones:**

#### A. Información General
```
Pedido #1234
Estado: En camino 🚚
Creado: 12 Oct 2025, 14:30
```

#### B. Productos
```
1x Hamburguesa Clásica    $8.990
2x Papas Fritas           $4.990
1x Coca Cola              $1.990
──────────────────────────────────
Total:                   $20.960
```

#### C. Información de Entrega
```
📍 Dirección: Av. Principal 123, Santiago
📞 Teléfono: +56912345678
👤 Nombre: María González
```

#### D. Método de Pago
```
💳 Tarjeta (Mercado Pago)
Estado: Pagado ✅
```

#### E. **Botón de Tracking** (visible solo cuando `status = 'in_delivery'`)
```
┌────────────────────────────────────┐
│  🗺️  VER UBICACIÓN EN TIEMPO REAL │
└────────────────────────────────────┘
```

**Código relevante:**
```typescript
{order.status === 'in_delivery' && (
  <Link href={`/orders/${order.id}/tracking`}>
    <Button className="w-full">
      🗺️ Ver Ubicación en Tiempo Real
    </Button>
  </Link>
)}
```

---

### 5️⃣ **Tracking en Tiempo Real** ⭐
**Ruta:** `/orders/[id]/tracking`

Esta es la página más importante para el seguimiento.

#### Vista del Mapa:
```
┌─────────────────────────────────────────────┐
│  [MAPA DE GOOGLE MAPS]                      │
│                                             │
│  📍 Ubicación del Repartidor (marker azul) │
│  🏠 Tu Dirección (marker rojo)             │
│  ━━━ Ruta dibujada entre ambos             │
│                                             │
└─────────────────────────────────────────────┘

Información del Repartidor:
👤 Juan Pérez
📞 +56912345678
[Botón: 📱 Llamar al Repartidor]

Estado: En camino 🚚
Tiempo estimado: 15 minutos
Distancia: 3.2 km

Último update: Hace 5 segundos
```

#### Componentes Técnicos:

**DeliveryMap Component:**
```typescript
// components/maps/delivery-map.tsx
- Google Maps API
- Marcador animado del repartidor (azul, bounce)
- Marcador del destino (rojo)
- Polyline (ruta) entre ambos puntos
- Auto-refresh cada 10 segundos
- InfoWindow con detalles
```

**Actualización Automática:**
```typescript
// Se actualiza cada 10 segundos
useEffect(() => {
  const interval = setInterval(() => {
    fetchDriverLocation()
  }, 10000) // 10 segundos
  
  return () => clearInterval(interval)
}, [orderId])
```

**API que consulta:**
- `/api/orders-mysql/[id]/tracking` - GET
  - Devuelve: `driver_location`, `delivery_address`, `driver_info`, `order_status`

---

## 🔄 Actualizaciones de Ubicación del Repartidor

### Del lado del Repartidor:

Cuando el repartidor marca "Iniciar Entrega":
1. Su ubicación se envía cada 10 segundos
2. Se guarda en `delivery_assignments.current_location`
3. El cliente ve el marcador moverse en tiempo real

**API del Repartidor:**
```typescript
// /api/driver/location (POST)
{
  "latitude": -33.4489,
  "longitude": -70.6693,
  "order_id": 1234
}
```

---

## 📱 Notificaciones (Próximo)

Actualmente el cliente debe:
1. Entrar a `/orders`
2. Hacer clic en su pedido
3. Ver el botón de tracking
4. Hacer clic para ver el mapa

**Mejoras futuras:**
- ✉️ Email con link directo al tracking
- 📲 SMS con link al tracking
- 🔔 Notificación cuando el repartidor está cerca (< 1 km)
- 🔔 Notificación cuando cambia el estado

---

## 🎨 Diseño Responsive

### Desktop:
- Mapa ocupa 70% del ancho
- Panel de información a la derecha (30%)
- Botón de llamar prominente

### Mobile:
- Mapa ocupa toda la pantalla
- Información en tarjeta flotante arriba
- Botón de llamar sticky en la parte inferior

---

## 🔗 Links Importantes

### Para el Cliente:
- **Mis Pedidos:** `/orders`
- **Detalle del Pedido:** `/orders/[id]`
- **Tracking en Vivo:** `/orders/[id]/tracking`

### APIs Utilizadas:
- `GET /api/orders-mysql` - Lista de pedidos del usuario
- `GET /api/orders-mysql/[id]` - Detalle de un pedido
- `GET /api/orders-mysql/[id]/tracking` - Ubicación en tiempo real

---

## 🚀 Ejemplo de Uso Real

### Escenario: Cliente "María González"

**12:00 PM** - María hace su pedido de hamburguesas
- 🎉 Ve página de thank-you con confetti
- ✅ Recibe confirmación de pedido #1234

**12:05 PM** - Restaurante confirma
- Estado: `confirmado`
- María puede ver esto en `/orders`

**12:20 PM** - Pedido listo
- Estado: `listo`
- Admin asigna repartidor (Juan Pérez)
- Estado cambia a: `asignado`

**12:25 PM** - Juan acepta y sale
- Estado: `en camino`
- 🗺️ Aparece botón "Ver Ubicación en Tiempo Real"

**12:26 PM** - María hace clic en el botón
- Ve mapa con ubicación de Juan
- Ve que está a 3.2 km de distancia
- Ve ruta trazada en el mapa
- Marcador de Juan se mueve cada 10 segundos

**12:40 PM** - Juan llega
- Juan marca como entregado
- Estado: `entregado`
- María ve confirmación en `/orders/1234`

---

## 📊 Métricas de Tracking

### Información Visible para el Cliente:
- ✅ Ubicación actual del repartidor (lat, lng)
- ✅ Distancia estimada (calculada con Google Maps)
- ✅ Tiempo estimado de llegada
- ✅ Nombre y teléfono del repartidor
- ✅ Estado del pedido en tiempo real
- ✅ Última actualización (timestamp)

### Información NO Visible:
- ❌ Historial de ubicaciones previas
- ❌ Ruta exacta que tomó el repartidor
- ❌ Velocidad del repartidor
- ❌ Otros pedidos del repartidor

---

## 🛠️ Configuración Requerida

### 1. Google Maps API Key
```env
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAAEDbSXamj1l-ThrvFqyrBWOo9rMdKQLU
```

**APIs habilitadas:**
- ✅ Maps JavaScript API
- ✅ Geocoding API
- ✅ Directions API (opcional para rutas)

### 2. Permisos de Ubicación

El repartidor debe:
1. Permitir ubicación en el navegador
2. Estar usando HTTPS (producción)
3. Mantener el panel abierto durante la entrega

---

## 🐛 Solución de Problemas

### "No veo el botón de tracking"
- Verificar que el estado sea `in_delivery`
- Verificar que el pedido tenga repartidor asignado
- Verificar en `/api/orders-mysql/[id]` que tenga `status = 'in_delivery'`

### "El mapa no carga"
- Verificar Google Maps API Key en `.env.local`
- Verificar que la API Key tenga Maps JavaScript API habilitada
- Verificar console del navegador para errores

### "La ubicación no se actualiza"
- Verificar que el repartidor haya iniciado la entrega
- Verificar que el repartidor tenga ubicación habilitada
- Verificar que `delivery_assignments.current_location` tenga datos
- Verificar en Network tab que `/api/orders-mysql/[id]/tracking` devuelva datos

### "El marcador no se mueve"
- El repartidor debe estar enviando ubicación cada 10 segundos
- Verificar que `current_location` en DB se esté actualizando
- Verificar timestamp de `updated_at` en `delivery_assignments`

---

## 📖 Documentación Relacionada

- `FLUJO-DELIVERY.md` - Flujo completo del sistema de delivery
- `AUTO-ASIGNACION.md` - Sistema de auto-asignación
- `INSTRUCCIONES-REPARTIDOR.md` - Guía para repartidores

---

## ✅ Checklist de Verificación

Antes de poner en producción, verificar:

- [ ] Google Maps API Key configurada
- [ ] API Key tiene las APIs necesarias habilitadas
- [ ] Repartidor puede enviar ubicación
- [ ] Cliente puede ver el mapa
- [ ] Marcadores aparecen correctamente
- [ ] Auto-refresh funciona (10 seg)
- [ ] Botón de tracking solo aparece en estado correcto
- [ ] Responsive en mobile
- [ ] HTTPS habilitado (requerido para geolocalización)
- [ ] Permisos de ubicación solicitados correctamente
