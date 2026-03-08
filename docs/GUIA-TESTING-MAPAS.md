# 🧪 Guía de Testing - Sistema de Mapas

## ✅ Pre-requisitos

1. **Servidor corriendo**: `pnpm dev`
2. **Base de datos actualizada**: Las columnas de GPS y JSON deben existir
3. **Configuración del restaurante**: Debe tener coordenadas

---

## 📋 Test 1: Crear Pedido con Delivery

### Pasos:
```bash
1. Ir a http://localhost:3000/demo
2. Agregar productos al carrito (min $100)
3. Click en "Ir al Checkout"
4. Seleccionar "Delivery"
5. Escribir dirección: "Zenon Fernandez 500, San Luis Potosí, SLP"
6. Esperar 1 segundo (auto-cálculo)
7. Verificar que aparece:
   - Costo de envío calculado
   - Distancia (X km)
   - Tiempo estimado (X minutos)
   - Preview del mapa con ruta
8. Completar nombre y teléfono
9. Seleccionar "Efectivo"
10. Click "Realizar Pedido"
```

### ✅ Resultado Esperado:
- Redirige a página "Thank You"
- Botón "Rastrear Pedido" visible
- Orden creada en BD con coordenadas

### 🔍 Verificar en BD:
```sql
SELECT id, delivery_address FROM orders ORDER BY id DESC LIMIT 1;
```

Debe retornar JSON:
```json
{
  "street": "Zenon Fernandez 500, San Luis Potosí, SLP",
  "lat": 22.1565,
  "lng": -100.9855
}
```

---

## 📋 Test 2: Tracking del Cliente

### Pasos:
```bash
1. Desde "Thank You" → Click "Rastrear Pedido"
   O ir directo a: http://localhost:3000/orders/[ORDER_ID]/tracking
2. Verificar que muestra:
   - Timeline del pedido
   - Mapa con 2 marcadores:
     * 🍽️ Restaurante
     * 🏠 Tu dirección
   - Detalles del pedido
```

### ✅ Resultado Esperado:
- Mapa carga correctamente
- Marcadores visibles
- Timeline muestra estado "Pendiente"
- No hay errores en consola

---

## 📋 Test 3: Asignar Driver

### Pasos:
```bash
# En otra ventana/tab (como admin)
1. Ir a http://localhost:3000/admin/pedidos
2. Buscar el pedido recién creado
3. Click en "Asignar Driver"
4. Seleccionar un driver
5. Confirmar asignación
```

### ✅ Resultado Esperado:
- Driver asignado correctamente
- Status cambia a "assigned"

---

## 📋 Test 4: Dashboard del Driver

### Pre-requisito: Crear usuario driver
```sql
-- Si no tienes uno, crear:
INSERT INTO users (username, email, password, is_driver, phone) 
VALUES ('Driver Test', 'driver@test.com', '$2b$10$K7YrqE0qP4YqZ9YqZ9YqZ', 1, '444-123-4567');
```

### Pasos:
```bash
1. Logout del admin
2. Login con driver@test.com
3. Ir a http://localhost:3000/driver/dashboard
4. Navegador pedirá permisos de GPS → ACEPTAR
5. Verificar que muestra:
   - Lista de entregas asignadas
   - Mapa grande con 3 marcadores:
     * 🚗 Tu ubicación (GPS)
     * 🍽️ Restaurante
     * 🏠 Dirección de entrega
   - Indicador "GPS Activo"
```

### ✅ Resultado Esperado:
- Mapa carga con ubicaciones
- GPS activo (círculo verde pulsante)
- Lista de pedidos visible
- Botón "Aceptar" disponible

---

## 📋 Test 5: Aceptar Entrega (Driver)

### Pasos:
```bash
1. En dashboard del driver
2. Click en "Aceptar" en el pedido
3. Verificar que:
   - Status cambia a "Aceptado"
   - Botón cambia a "Marcar como Entregado"
```

---

## 📋 Test 6: GPS en Tiempo Real

### Necesitas 2 ventanas/dispositivos:

**Ventana 1 (Cliente):**
```bash
http://localhost:3000/orders/[ORDER_ID]/tracking
```

**Ventana 2 (Driver):**
```bash
http://localhost:3000/driver/dashboard
(con GPS activo)
```

### Pasos:
```bash
1. Esperar 30 segundos (tiempo de actualización GPS)
2. En ventana del cliente → Refrescar página
3. Verificar que el marcador 🚗 del driver aparece
4. Mover físicamente el dispositivo del driver (o emular GPS)
5. Esperar 30 segundos más
6. Refrescar tracking del cliente
7. Verificar que la ubicación del driver se actualizó
```

### ✅ Resultado Esperado:
- Ubicación del driver visible en tracking
- Se actualiza cada 30 segundos
- Cliente puede ver dónde está el driver

---

## 📋 Test 7: Completar Entrega

### Pasos:
```bash
1. En dashboard del driver
2. Click "Marcar como Entregado"
3. Verificar en tracking del cliente:
   - Status cambia a "Entregado"
   - Timeline muestra checkmark verde en "Entregado"
```

---

## 🐛 Troubleshooting

### Problema: Mapa no carga
**Solución:**
```bash
# Verificar que leaflet está instalado
pnpm list leaflet react-leaflet

# Si no está, instalar:
pnpm add leaflet react-leaflet
pnpm add -D @types/leaflet
```

### Problema: Error "delivery_address is not JSON"
**Solución:**
```bash
node scripts/update-orders-delivery-address.js
```

### Problema: GPS no funciona
**Causas posibles:**
- Navegador bloqueó permisos → Ir a configuración y permitir
- Usando HTTP en producción → GPS requiere HTTPS
- No hay columnas driver_lat/lng → Ejecutar script de DB

### Problema: Coordenadas son NULL
**Verificar:**
1. Que la API de cálculo funciona: `POST /api/delivery/calculate-cost`
2. Que el checkout espera 1 segundo después de escribir dirección
3. Que deliveryLocation tiene valor antes de crear orden

### Problema: Driver no aparece en tracking
**Verificar:**
1. Que el driver aceptó la entrega
2. Que el GPS está activo (círculo verde)
3. Que pasaron al menos 30 segundos desde que activó GPS
4. Refrescar página del cliente

---

## 📊 Checklist Final

- [ ] Orden se crea con coordenadas en delivery_address
- [ ] Tracking muestra mapa con restaurante y destino
- [ ] Driver dashboard muestra mapa con GPS
- [ ] GPS se actualiza cada 30 segundos
- [ ] Cliente ve ubicación del driver en tiempo real
- [ ] Completar entrega funciona
- [ ] No hay errores en consola
- [ ] Todo funciona en móvil

---

## 🎯 Siguiente Paso

Si todos los tests pasan → **¡Sistema listo para producción!** 🚀

Si hay errores → Revisar logs en consola y verificar que:
1. Base de datos tiene las columnas correctas
2. Configuración del restaurante existe
3. Permisos de GPS están habilitados
