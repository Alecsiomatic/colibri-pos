import fs from 'fs';
import path from 'path';
import readline from 'readline';

const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');

// Lista de nombres correctos en orden
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

async function renameFiles() {
  console.log('📋 ARCHIVOS ENCONTRADOS:\n');
  
  const files = fs.readdirSync(uploadsDir)
    .filter(f => f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.jpg'))
    .sort();
  
  files.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total: ${files.length} archivos`);
  console.log('Necesitamos: 23 archivos\n');
  
  console.log('📝 NOMBRES CORRECTOS NECESARIOS:\n');
  correctNames.forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 INSTRUCCIONES:');
  console.log('   Voy a renombrar automáticamente basándome en el orden.');
  console.log('   Si el archivo tiene un nombre relacionado, lo emparejaré.\n');
  
  // Intentar emparejar automáticamente
  const mapping: { old: string; new: string }[] = [];
  
  files.forEach((file, index) => {
    if (index < correctNames.length) {
      mapping.push({
        old: file,
        new: correctNames[index]
      });
    }
  });
  
  console.log('📋 MAPEO PROPUESTO:\n');
  mapping.forEach((m, i) => {
    console.log(`${i + 1}. "${m.old}" → "${m.new}"`);
  });
  
  console.log('\n⚠️  ¿Proceder con el renombrado? (Escribe "si" para confirmar)');
}

renameFiles();
