import fs from 'fs';
import path from 'path';

const requiredImages = [
  // Hamburguesas
  'galaxy-burger.jpg',
  'orbit-burger.jpg',
  'orion-burger.jpg',
  'gravity-burger.jpg',
  'planet-burger.jpg',
  'moon-burger.jpg',
  'supermassive-burger.jpg',
  'nebula-burger.jpg',
  'big-bang-burger.jpg',
  
  // Menú Infantil
  'pyxis-burger.jpg',
  'apollo-burger.jpg',
  'meteor-nuggets.jpg',
  
  // Wings
  'galactic-wings.jpg',
  
  // Bebidas
  'capuchino.jpg',
  'cafe-americano.jpg',
  'cafe-espresso.jpg',
  'agua-mineral-con-sabor.jpg',
  'agua-mineral.jpg',
  'agua-natural.jpg',
  'refrescos-coca-cola.jpg',
  
  // Postres
  'waffle.jpg',
  'affogato.jpg',
  'pan-de-elote.jpg',
];

const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');

console.log('📁 Verificando imágenes en:', uploadsDir);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Verificar si existe el directorio
if (!fs.existsSync(uploadsDir)) {
  console.log('❌ La carpeta public/uploads/products no existe');
  console.log('💡 Créala manualmente o ejecuta: mkdir -p public/uploads/products\n');
  process.exit(1);
}

// Verificar cada imagen
const existing: string[] = [];
const missing: string[] = [];

requiredImages.forEach(img => {
  const imgPath = path.join(uploadsDir, img);
  if (fs.existsSync(imgPath)) {
    existing.push(img);
  } else {
    missing.push(img);
  }
});

// Mostrar resultados
console.log(`✅ Imágenes encontradas: ${existing.length}/${requiredImages.length}\n`);

if (existing.length > 0) {
  console.log('🟢 ENCONTRADAS:');
  existing.forEach(img => console.log(`   ✓ ${img}`));
  console.log();
}

if (missing.length > 0) {
  console.log('🔴 FALTAN:');
  missing.forEach(img => console.log(`   ✗ ${img}`));
  console.log();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`⚠️  Faltan ${missing.length} imágenes por colocar`);
  console.log('📂 Colócalas en: public/uploads/products/');
} else {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 ¡TODAS LAS IMÁGENES ESTÁN LISTAS!');
}

console.log();
