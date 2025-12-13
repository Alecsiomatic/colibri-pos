# 🖼️ GUÍA: Sistema de Imágenes

## ⚠️ PROBLEMA ACTUAL

El sistema guarda imágenes en `public/uploads/products/`, pero:

- ✅ **Funciona en desarrollo local** (localhost)
- ❌ **NO funciona en producción (Vercel)** - Las imágenes se pierden en cada deploy

## 🎯 SOLUCIONES

### Opción 1: Cloudinary (RECOMENDADO - GRATIS)

**Pros:**
- ✅ 25GB gratis/mes
- ✅ CDN global (carga rápida)
- ✅ Redimensionamiento automático
- ✅ Optimización automática

**Implementación:**
1. Crear cuenta en https://cloudinary.com
2. Instalar: `npm install cloudinary`
3. Configurar API en `.env.local`

### Opción 2: Vercel Blob Storage

**Pros:**
- ✅ Integrado con Vercel
- ✅ Configuración simple
- ✅ 1GB gratis

**Contras:**
- ⚠️ Más caro después del tier gratis

### Opción 3: Subir manualmente al servidor

**Para desarrollo:**
1. Subir las 23 imágenes vía FTP/cPanel a tu hosting
2. Colocarlas en la ruta correcta del servidor
3. Actualizar las URLs en la DB

---

## 📝 PARA USAR CLOUDINARY (Recomendado)

### 1. Crear archivo de configuración

```typescript
// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

### 2. Actualizar endpoint de upload

```typescript
// app/api/upload/route.ts
import cloudinary from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  // Subir a Cloudinary
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'manu-products' },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    ).end(buffer)
  })
  
  return NextResponse.json({ 
    success: true, 
    url: result.secure_url 
  })
}
```

### 3. Configurar variables de entorno

```env
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

---

## 🚀 PARA DESARROLLO LOCAL (Funciona ahora)

El sistema actual funciona perfectamente en `localhost:3000`:

1. Las imágenes se guardan en `public/uploads/products/`
2. Se acceden vía `/uploads/products/nombre.jpg`
3. Next.js sirve automáticamente archivos de `public/`

**Solo necesitas colocar las 23 imágenes en:**
```
public/uploads/products/
```

---

## 💡 RECOMENDACIÓN

Para producción, usa **Cloudinary**:
- Es gratis hasta 25GB/mes
- Las imágenes nunca se pierden
- Carga super rápida con CDN global
- Optimización automática de imágenes

¿Quieres que implemente Cloudinary ahora?
