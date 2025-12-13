# Integración de Mercado Pago

## 🎯 Estado de la Integración

✅ **COMPLETADO** - Sistema de pagos con Mercado Pago integrado

## 📋 Componentes Implementados

### 1. Base de Datos
- ✅ Tabla `system_settings` creada para almacenar credenciales
- ✅ Campos agregados a tabla `orders`:
  - `payment_preference_id` - ID de preferencia de pago de MP
  - `payment_id` - ID de transacción de MP
  - `payment_details` - Detalles del pago (JSON)

### 2. Backend APIs
- ✅ `/api/admin/settings` - GET/POST para gestionar configuraciones
- ✅ `/api/mercadopago/create-preference` - Crear preferencia de pago
- ✅ `/api/mercadopago/webhook` - Recibir notificaciones de MP

### 3. Frontend
- ✅ `/admin/settings` - Panel de configuración con formulario
- ✅ Checkout actualizado con opción de pago con tarjeta
- ✅ Flujo de pago integrado

### 4. Scripts de Utilidad
- ✅ `scripts/create-settings-table.ts` - Crear tabla de configuraciones
- ✅ `scripts/add-payment-fields.ts` - Agregar campos de pago a órdenes
- ✅ `scripts/check-mp-settings.ts` - Verificar estado de configuración

## 🚀 Cómo Configurar Mercado Pago

### Paso 1: Obtener Credenciales

1. Ve a [Mercado Pago Developers](https://www.mercadopago.com.mx/developers/panel)
2. Inicia sesión con tu cuenta de Mercado Pago
3. Ve a **"Tus integraciones"** → **"Credenciales"**
4. Copia:
   - **Public Key** (APP_USR-xxxxxxxx...)
   - **Access Token** (APP_USR-xxxxxxxx...)

### Paso 2: Configurar en el Panel Admin

1. Inicia sesión como administrador
2. Ve a **Admin** → **Configuración** (`/admin/settings`)
3. Pega las credenciales:
   - Public Key en el campo correspondiente
   - Access Token en el campo correspondiente
4. Activa el switch **"Habilitado"**
5. Haz clic en **"Guardar Configuración"**

### Paso 3: Verificar Configuración

Ejecuta el script de verificación:

```bash
npx tsx scripts/check-mp-settings.ts
```

Deberías ver:
```
✅ Mercado Pago está completamente configurado y habilitado
```

## 💳 Flujo de Pago para Clientes

### 1. Usuario agrega productos al carrito
- Desde el menú, añade burguesas al carrito flotante

### 2. Va al checkout
- Click en "Ir al Checkout" desde el carrito
- Completa información personal (nombre, teléfono, email)
- Selecciona tipo de entrega (delivery o recoger)
- **Selecciona método de pago**:
  - 💵 **Efectivo** - Paga al recibir
  - 💳 **Tarjeta** - Paga con Mercado Pago

### 3. Si selecciona Mercado Pago
- Click en "Confirmar Pedido"
- Se crea la orden en la base de datos
- Se genera preferencia de pago en MP
- **Redirección automática a Mercado Pago**

### 4. En Mercado Pago
- Usuario ingresa datos de su tarjeta
- Completa el pago
- MP procesa la transacción

### 5. Callback y Webhook
- MP envía notificación al webhook
- Sistema actualiza estado de la orden:
  - `approved` → orden confirmada, pago exitoso
  - `pending` → pago pendiente
  - `rejected` → pago rechazado
- Usuario es redirigido a `/orders/[id]` con el estado

## 🔧 URLs de Callback

El sistema está configurado para redireccionar a:

- **Éxito**: `/orders/[id]?status=success`
- **Pendiente**: `/orders/[id]?status=pending`
- **Fallo**: `/checkout?status=failure`

## 🌐 Webhook URL

Para producción, debes configurar el webhook en Mercado Pago:

1. Ve a tu panel de MP → Webhooks
2. Agrega la URL: `https://tudominio.com/api/mercadopago/webhook`
3. Selecciona el evento: **Payments**

## 🧪 Modo de Prueba

Mercado Pago tiene dos modos:

- **Sandbox (Pruebas)**: Usa credenciales de prueba
- **Producción**: Usa credenciales reales

Para probar sin cobrar dinero real:
1. Obtén credenciales de prueba en el panel de MP
2. Úsalas en `/admin/settings`
3. Usa [tarjetas de prueba de MP](https://www.mercadopago.com.mx/developers/es/docs/checkout-api/integration-test/test-cards)

Ejemplo de tarjeta de prueba:
- **Número**: 5031 7557 3453 0604
- **Vencimiento**: 11/25
- **CVV**: 123
- **Nombre**: APRO (para aprobar) o OTHE (para rechazar)

## 📊 Campos en Base de Datos

### Tabla `system_settings`
```sql
CREATE TABLE system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

### Tabla `orders` (nuevos campos)
```sql
ALTER TABLE orders 
ADD COLUMN payment_preference_id VARCHAR(255) NULL,
ADD COLUMN payment_id VARCHAR(255) NULL,
ADD COLUMN payment_details TEXT NULL
```

## 🔒 Seguridad

- ✅ Access Token se almacena con flag `is_encrypted`
- ✅ Token se muestra enmascarado en el frontend (campo password)
- ✅ API `/api/admin/settings` debe estar protegida con autenticación
- ⚠️ **IMPORTANTE**: Nunca expongas el Access Token en el código del cliente

## 📝 Notas Importantes

1. **Entorno de Producción**:
   - Asegúrate de usar credenciales de producción (no de prueba)
   - Configura el webhook en MP con tu dominio real
   - Usa HTTPS en producción (requerido por MP)

2. **Manejo de Errores**:
   - Si MP rechaza el pago, el usuario vuelve al checkout
   - Si hay error de red, se muestra mensaje al usuario
   - Los logs de MP se guardan en consola del servidor

3. **Estados de Pago**:
   - `pending` - Pago pendiente
   - `paid` - Pago exitoso
   - `failed` - Pago rechazado

4. **Estados de Orden**:
   - `pending` - Orden creada, esperando confirmación
   - `confirmed` - Pago aprobado, lista para preparar
   - `cancelled` - Pago rechazado o cancelado

## 🐛 Troubleshooting

### Problema: "Mercado Pago no está habilitado"
**Solución**: Ve a `/admin/settings` y activa el switch

### Problema: "Access Token no configurado"
**Solución**: Pega tu Access Token en `/admin/settings`

### Problema: Webhook no funciona
**Solución**: 
- Verifica que la URL del webhook esté correcta en MP
- Revisa logs del servidor para ver errores
- Asegúrate de usar HTTPS en producción

### Problema: Pago aprobado pero orden no se actualiza
**Solución**: 
- Verifica que el webhook esté configurado correctamente
- Revisa la tabla `orders` para ver el estado
- Revisa logs de `/api/mercadopago/webhook`

## ✅ Checklist de Producción

Antes de lanzar a producción:

- [ ] Obtener credenciales de producción de MP
- [ ] Configurar credenciales en `/admin/settings`
- [ ] Habilitar Mercado Pago con el switch
- [ ] Configurar webhook en panel de MP
- [ ] Verificar con `npx tsx scripts/check-mp-settings.ts`
- [ ] Probar flujo completo con tarjeta de prueba
- [ ] Verificar que los callbacks redirijan correctamente
- [ ] Verificar que el webhook actualice las órdenes
- [ ] Usar HTTPS en producción (obligatorio)
- [ ] Probar con dinero real (pequeña cantidad)

## 📚 Recursos

- [Documentación de MP](https://www.mercadopago.com.mx/developers/es/docs)
- [API Reference](https://www.mercadopago.com.mx/developers/es/reference)
- [Tarjetas de Prueba](https://www.mercadopago.com.mx/developers/es/docs/checkout-api/integration-test/test-cards)
- [Webhooks](https://www.mercadopago.com.mx/developers/es/docs/checkout-api/additional-content/your-integrations/notifications/webhooks)

---

**Estado**: ✅ Listo para configurar y probar
**Última actualización**: 12 de Octubre, 2025
