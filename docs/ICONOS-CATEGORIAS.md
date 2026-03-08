# 🎨 Iconos de Categorías

## Sistema de Iconos Dinámicos

Las categorías ahora usan iconos dinámicos desde la base de datos. El campo `icon` en la tabla `categories` define qué icono mostrar.

## 📊 Base de Datos

La tabla `categories` incluye la columna `icon` (VARCHAR(50)):

```sql
ALTER TABLE categories ADD COLUMN icon VARCHAR(50) NULL AFTER name;
```

## 🎯 Iconos Disponibles

Los siguientes nombres de iconos están disponibles (se mapean a iconos de lucide-react):

### Comida
- `cake` - Pastel (Postres)
- `beef` - Carne (Hamburguesas, carnes)
- `drumstick` - Pierna de pollo (Alitas, boneless)
- `pizza` - Pizza
- `sandwich` - Sandwich
- `croissant` - Croissant (Panadería)
- `cookie` - Galleta
- `soup` - Sopa
- `fish` - Pescado
- `egg` - Huevo (Desayunos)
- `salad` - Ensalada

### Bebidas
- `coffee` - Café
- `wine` - Vino
- `beer` - Cerveza
- `milk` - Leche

### Frutas y Vegetales
- `apple` - Manzana
- `cherry` - Cereza
- `banana` - Banana
- `carrot` - Zanahoria
- `pepper` - Pimiento

### Especiales
- `baby` - Bebé (Menú infantil)
- `utensils-crossed` - Cubiertos cruzados (Acompañamientos)
- `ice-cream` - Helado

### Decorativos
- `flame` - Flama (Picante)
- `sparkles` - Destellos (Especial)
- `snowflake` - Copo de nieve (Frío)
- `star` - Estrella (Destacado)
- `heart` - Corazón (Favorito)
- `package` - Paquete (Por defecto)

## 🎨 Sistema de Colores

Los colores se asignan automáticamente según el nombre de la categoría:

- **Hamburguesas**: Naranja/Ámbar
- **Alitas/Wings**: Ámbar/Amarillo
- **Bebidas**: Azul cielo/Cyan
- **Postres**: Rosa/Rose
- **Infantil**: Púrpura/Pink
- **Acompañamientos**: Verde/Esmeralda
- **Por defecto**: Slate/Gris

## 📝 Actualizar Iconos

### SQL Directo

```sql
-- Actualizar icono de una categoría
UPDATE categories SET icon = 'beef' WHERE name = 'Hamburguesas';
UPDATE categories SET icon = 'drumstick' WHERE name = 'Boneless & Wings';
UPDATE categories SET icon = 'coffee' WHERE name = 'Bebidas';
UPDATE categories SET icon = 'cake' WHERE name = 'Postres';
UPDATE categories SET icon = 'baby' WHERE name = 'Menú Infantil';
UPDATE categories SET icon = 'utensils-crossed' WHERE name = 'Acompañamientos';
```

### Script Node.js

```javascript
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu'
  });
  
  // Actualizar icono
  await conn.execute(
    'UPDATE categories SET icon = ? WHERE id = ?',
    ['pizza', 5] // Cambiar categoría 5 a icono de pizza
  );
  
  await conn.end();
})();
```

## 🔧 Agregar Nuevos Iconos

1. Verificar que el icono existe en lucide-react: https://lucide.dev/icons
2. Agregar el mapeo en `components/kiosk/WelcomeBubblyPanel.tsx`:

```typescript
const iconMap: Record<string, string> = {
  // ... iconos existentes
  'nuevo-icono': 'NombreDelComponenteLucide',
};
```

3. Actualizar la categoría en la base de datos:

```sql
UPDATE categories SET icon = 'nuevo-icono' WHERE id = X;
```

## ✨ Características

- ✅ Iconos dinámicos desde la base de datos
- ✅ Sistema de colores automático según nombre de categoría
- ✅ Efectos visuales (glow, rotación, escala en hover)
- ✅ 35+ iconos predefinidos
- ✅ Fallback a icono por defecto si no existe
- ✅ Compatible con todas las vistas (kiosk, menu)
- ✅ Fácil de actualizar sin tocar código

## 🎯 Uso en Admin

Para permitir que el admin actualice iconos desde el panel, agregar un selector en el formulario de categorías con los iconos disponibles.
