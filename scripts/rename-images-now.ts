import fs from 'fs';
import path from 'path';

const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');

const correctNames = [
  'galaxy-burger.jpg',
  'orbit-burger.jpg',
  'orion-burger.jpg',
  'gravity-burger.jpg',
  'planet-burger.jpg',
  'moon-burger.jpg',
  'supermassive-burger.jpg',
  'nebula-burger.jpg',
  'big-bang-burger.jpg',
  'pyxis-burger.jpg',
  'apollo-burger.jpg',
  'meteor-nuggets.jpg',
  'galactic-wings.jpg',
  'capuchino.jpg',
  'cafe-americano.jpg',
  'cafe-espresso.jpg',
  'agua-mineral-con-sabor.jpg',
  'agua-mineral.jpg',
  'agua-natural.jpg',
  'refrescos-coca-cola.jpg',
  'waffle.jpg',
  'affogato.jpg',
  'pan-de-elote.jpg',
];

async function renameAllFiles() {
  console.log('🔄 Renombrando archivos...\n');
  
  const files = fs.readdirSync(uploadsDir)
    .filter(f => f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.jpg'))
    .sort();
  
  let renamed = 0;
  let skipped = 0;
  
  files.forEach((file, index) => {
    if (index < correctNames.length) {
      const oldPath = path.join(uploadsDir, file);
      const newPath = path.join(uploadsDir, correctNames[index]);
      
      try {
        fs.renameSync(oldPath, newPath);
        console.log(`✅ ${file} → ${correctNames[index]}`);
        renamed++;
      } catch (error) {
        console.error(`❌ Error renombrando ${file}:`, error);
      }
    } else {
      console.log(`⏭️  Saltando ${file} (archivo extra)`);
      skipped++;
    }
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ ${renamed} archivos renombrados`);
  console.log(`⏭️  ${skipped} archivos extras`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🎉 ¡Listo! Recarga el navegador para ver las imágenes.');
}

renameAllFiles();
