import fs from 'fs';
import path from 'path';
import https from 'https';

const products = [
  { name: 'galaxy-burger.jpg', category: 'burger' },
  { name: 'orbit-burger.jpg', category: 'burger' },
  { name: 'orion-burger.jpg', category: 'burger' },
  { name: 'gravity-burger.jpg', category: 'burger' },
  { name: 'planet-burger.jpg', category: 'burger' },
  { name: 'moon-burger.jpg', category: 'burger' },
  { name: 'supermassive-burger.jpg', category: 'burger' },
  { name: 'nebula-burger.jpg', category: 'burger' },
  { name: 'big-bang-burger.jpg', category: 'burger' },
  { name: 'pyxis-burger.jpg', category: 'burger' },
  { name: 'apollo-burger.jpg', category: 'burger' },
  { name: 'meteor-nuggets.jpg', category: 'nuggets' },
  { name: 'galactic-wings.jpg', category: 'wings' },
  { name: 'capuchino.jpg', category: 'coffee' },
  { name: 'cafe-americano.jpg', category: 'coffee' },
  { name: 'cafe-espresso.jpg', category: 'coffee' },
  { name: 'agua-mineral-con-sabor.jpg', category: 'water' },
  { name: 'agua-mineral.jpg', category: 'water' },
  { name: 'agua-natural.jpg', category: 'water' },
  { name: 'refrescos-coca-cola.jpg', category: 'soda' },
  { name: 'waffle.jpg', category: 'dessert' },
  { name: 'affogato.jpg', category: 'dessert' },
  { name: 'pan-de-elote.jpg', category: 'dessert' },
];

const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');

// Placeholders de picsum.photos (imágenes reales de comida)
const placeholders: Record<string, string> = {
  burger: 'https://picsum.photos/seed/burger/600/400',
  nuggets: 'https://picsum.photos/seed/nuggets/600/400',
  wings: 'https://picsum.photos/seed/wings/600/400',
  coffee: 'https://picsum.photos/seed/coffee/600/400',
  water: 'https://picsum.photos/seed/water/600/400',
  soda: 'https://picsum.photos/seed/soda/600/400',
  dessert: 'https://picsum.photos/seed/dessert/600/400',
};

async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function createPlaceholders() {
  console.log('🖼️  Creando imágenes placeholder...\n');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Carpeta creada:', uploadsDir, '\n');
  }

  for (const product of products) {
    const filepath = path.join(uploadsDir, product.name);
    
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  ${product.name} ya existe, saltando...`);
      continue;
    }

    try {
      const placeholderUrl = placeholders[product.category] + `&random=${Math.random()}`;
      await downloadImage(placeholderUrl, filepath);
      console.log(`✅ ${product.name} creado`);
      
      // Delay para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Error creando ${product.name}:`, error);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Placeholders creados');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 NOTA: Estas son imágenes temporales.');
  console.log('   Reemplázalas con las fotos reales de tus productos.\n');
}

createPlaceholders()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
