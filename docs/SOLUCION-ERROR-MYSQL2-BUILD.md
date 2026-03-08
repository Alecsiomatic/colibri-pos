# ✅ Solución Error de Build: mysql2 en Cliente

## 🔴 Problema Original

El build de producción fallaba con el error:
```
Module not found: Can't resolve 'tls'
Module not found: Can't resolve 'net'
```

**Causa:** El componente cliente `app/menu/categoria/[slug]/page.tsx` importaba directamente desde `lib/product-service.ts`, que usa `mysql2` (un módulo Node.js que requiere `tls` y `net`, no disponibles en el navegador).

## ✅ Solución Aplicada

### 1. Creación de API Routes

Se crearon 3 nuevas API routes para manejar las operaciones de base de datos en el servidor:

- **`/api/products/featured`** - Obtiene productos destacados
- **`/api/products/by-category`** - Obtiene productos por categoría
- **`/api/categories/with-products`** - Obtiene categorías con sus productos

### 2. Actualización de `lib/product-service.ts`

Se agregaron las funciones faltantes que requerían las páginas:

```typescript
export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  products?: Product[]
}

export async function getCategoriesWithProducts(): Promise<Category[]>
export async function getProductsByCategoryWithImages(categoryId: number): Promise<Product[]>
```

### 3. Actualización de `app/menu/categoria/[slug]/page.tsx`

**Antes:**
```typescript
import { getProductsByCategoryWithImages, getCategoriesWithProducts } from "@/lib/product-service"

// Llamada directa a funciones que usan mysql2
const categories = await getCategoriesWithProducts()
const productsData = await getProductsByCategoryWithImages(Number.parseInt(categoryId))
```

**Después:**
```typescript
// Definición local de tipos (sin importar desde product-service)
interface Product { ... }
interface Category { ... }

// Llamadas a API routes
const categoriesRes = await fetch('/api/categories/with-products')
const categories = await categoriesRes.json()

const productsRes = await fetch(`/api/products/by-category?categoryId=${categoryId}`)
const productsData = await productsRes.json()
```

## 📁 Archivos Modificados

1. ✅ `app/api/products/featured/route.ts` - CREADO
2. ✅ `app/api/products/by-category/route.ts` - CREADO
3. ✅ `app/api/categories/with-products/route.ts` - CREADO
4. ✅ `lib/product-service.ts` - ACTUALIZADO (agregadas funciones)
5. ✅ `app/menu/categoria/[slug]/page.tsx` - ACTUALIZADO (usa fetch en vez de imports directos)

## ✅ Resultado

```bash
pnpm build
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (125/125)
✓ Finalizing page optimization

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

**Build exitoso:** 125 páginas generadas, 0 errores críticos.

## 🎯 Lección Aprendida

**Regla de Next.js 15:**
- ❌ **NUNCA** importar módulos Node.js (`mysql2`, `fs`, `crypto`, etc.) en componentes cliente (`"use client"`)
- ✅ **SIEMPRE** usar API Routes (`/api/*`) para operaciones de servidor
- ✅ Los componentes cliente deben usar `fetch()` para comunicarse con las API routes

## 📊 Arquitectura Correcta

```
Cliente (Browser)          Servidor (Node.js)
┌─────────────────┐       ┌──────────────────┐
│ page.tsx        │       │ API Routes       │       ┌──────────────┐
│ "use client"    │──────>│ /api/products/*  │──────>│ MySQL DB     │
│                 │ fetch │                  │ mysql2│              │
│ - useState      │<──────│ - getFeatured()  │<──────│ srv440...    │
│ - useEffect     │ JSON  │ - getByCategory()│       └──────────────┘
└─────────────────┘       └──────────────────┘
```

## 🚀 Siguiente Paso

El sistema está listo para deployment en VPS. Continuar con:
1. Selección de OS (Ubuntu 22.04 LTS recomendado)
2. Configuración de servidor
3. Deployment con `deploy.sh`

---
**Fecha:** 22 de octubre, 2025  
**Estado:** ✅ Build exitoso - Listo para producción
