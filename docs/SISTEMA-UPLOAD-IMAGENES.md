# 📸 Sistema de Subida de Imágenes - Productos

## ✅ IMPLEMENTACIÓN COMPLETA

Se ha eliminado completamente el uso de URLs externas para imágenes de productos. Ahora el sistema usa **subida de archivos al servidor local**.

---

## 🎯 Lo que se implementó

### 1. **Endpoint de Upload (`/api/upload`)**
- **Ruta:** `POST /api/upload`
- **Autenticación:** Requiere usuario admin
- **Validaciones:**
  - Tipo de archivo: JPG, PNG, GIF, WEBP
  - Tamaño máximo: 5MB
  - Sanitización de nombres de archivo
  - Validación MIME type

**Código:** `app/api/upload/route.ts`

### 2. **Almacenamiento Local**
- **Directorio:** `public/uploads/products/`
- **Nombres únicos:** `{timestamp}-{nombre-original}.jpg`
- **URLs públicas:** `/uploads/products/{nombre-archivo}`
- **Gitignore:** Configurado para no subir imágenes al repositorio

### 3. **Formulario de Productos Actualizado**
- ✅ **Crear Producto:** Reemplazado campo de texto URL por componente de subida
- ✅ **Editar Producto:** Reemplazado campo de texto URL por componente de subida
- ✅ **Preview:** Vista previa instantánea al seleccionar archivo
- ✅ **Drag & Drop:** Interfaz moderna de arrastrar y soltar
- ✅ **Botón Quitar:** Permite remover imagen seleccionada

**Código:** `app/admin/products/page.tsx`

---

## 🎨 Características de la UI

### Componente de Subida
```tsx
- Área de drag & drop con borde punteado
- Icono de upload
- Preview de imagen (128x128px)
- Botón para quitar imagen
- Texto informativo: "PNG, JPG, GIF hasta 5MB"
```

### Estados Manejados
- `selectedFile`: Archivo seleccionado
- `previewUrl`: URL del preview (Data URL)
- `isUploading`: Estado de carga durante upload
- Se resetean al crear/editar/cerrar diálogos

---

## 🔒 Seguridad

1. **Autenticación requerida:** Solo admins pueden subir
2. **Validación de tipo:** Solo imágenes permitidas
3. **Validación de tamaño:** Máximo 5MB
4. **Sanitización:** Nombres de archivo limpiados de caracteres especiales
5. **Storage aislado:** Archivos en directorio público controlado

---

## 📁 Estructura de Archivos

```
public/
└── uploads/
    ├── .gitignore          # Ignora imágenes en git
    ├── README.md           # Documentación del sistema
    └── products/           # Imágenes de productos
        └── {timestamp}-{nombre}.jpg
```

---

## 🔧 Flujo de Trabajo

### Crear Producto con Imagen

1. Usuario abre diálogo "Crear Producto"
2. Llena campos (nombre, precio, descripción, etc.)
3. Selecciona imagen desde su computadora
4. Ve preview inmediato de la imagen
5. Click en "Crear Producto"
6. **Backend:**
   - Sube archivo a `/api/upload`
   - Guarda en `public/uploads/products/`
   - Devuelve URL pública
7. **Frontend:**
   - Usa URL devuelta en `image_url`
   - Crea producto en base de datos
8. Imagen visible inmediatamente en el listado

### Editar Producto con Nueva Imagen

1. Usuario click en "Editar" en un producto
2. Ve imagen actual (si existe)
3. Puede seleccionar nueva imagen
4. Ve preview de la nueva imagen
5. Click en "Guardar"
6. Nueva imagen se sube y reemplaza la URL anterior
7. Producto actualizado con nueva imagen

---

## 📊 Base de Datos

La columna `image_url` en la tabla `products` ahora almacena:

**Antes:**
```
https://ejemplo.com/imagen.jpg  ❌
```

**Ahora:**
```
/uploads/products/1728645123456-producto.jpg  ✅
```

---

## 🚀 Próximos Pasos (Opcional)

### Para Producción en la Nube:

1. **Migrar a S3/Cloudinary:**
   - Cambiar endpoint `/api/upload` para usar SDK de S3
   - Actualizar URLs para apuntar a CDN
   - Mantener misma interfaz de usuario

2. **Optimización de Imágenes:**
   - Agregar resize automático (thumbnails)
   - Compresión de imágenes
   - Generación de múltiples tamaños (responsive)

3. **Gestión Avanzada:**
   - Recorte de imágenes en el cliente
   - Múltiples imágenes por producto (galería)
   - Eliminar imágenes huérfanas automáticamente

---

## ⚠️ IMPORTANTE para Hostinger

Cuando subas a producción en Hostinger:

1. **Crear directorio uploads:**
   ```bash
   mkdir -p public/uploads/products
   chmod 755 public/uploads
   chmod 755 public/uploads/products
   ```

2. **Verificar permisos:**
   - El servidor web debe poder escribir en `public/uploads/products`
   - Normalmente usuario `www-data` o similar

3. **Backups:**
   - Incluir `/public/uploads` en backups regulares
   - O migrar a almacenamiento en la nube (recomendado)

4. **Espacio en disco:**
   - Monitorear uso de espacio
   - Configurar límites si es necesario

---

## 📝 Testing

Para probar el sistema:

1. Ir a `/admin/products`
2. Click en "Nuevo Producto"
3. Llenar campos básicos
4. En "Imagen del Producto":
   - Click en "Seleccionar archivo"
   - O arrastrar imagen al área punteada
5. Verificar que aparece el preview
6. Crear producto
7. Verificar que la imagen aparece en el listado
8. Probar editar y cambiar la imagen

---

## ✅ Resultado Final

- ❌ **NO más URLs externas que se rompan**
- ✅ **Imágenes 100% controladas por el sistema**
- ✅ **Upload rápido y simple**
- ✅ **Preview inmediato**
- ✅ **Seguro y validado**
- ✅ **Listo para producción**

---

**Fecha de implementación:** 2025-10-11
**Estado:** ✅ COMPLETO Y FUNCIONAL
