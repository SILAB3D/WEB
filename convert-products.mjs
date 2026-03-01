/**
 * Convierte las imágenes de nuevos productos a WebP comprimido.
 * Coloca las imágenes fuente en img/ con los nombres indicados abajo
 * (JPG, JPEG o PNG), luego ejecuta: node convert-products.mjs
 */

import sharp from 'sharp';
import { existsSync, readdirSync } from 'fs';
import path from 'path';

const IMG_DIR = './img';

// Pares [nombre-fuente-sin-extensión, nombre-destino]
const targets = [
  'trofeo',
  'disco-vinilo',
  'lamina-bicolor',
  'nombre-personalizado',
  'skyline',
  'tarta',
];

const extensions = ['.jpg', '.jpeg', '.png'];

let converted = 0;

for (const name of targets) {
  // Buscar archivo fuente con cualquier extensión soportada
  const src = extensions
    .map(ext => path.join(IMG_DIR, name + ext))
    .find(f => existsSync(f));

  if (!src) {
    console.warn(`⚠  No encontrado: ${name}.[jpg|jpeg|png] — omitido`);
    continue;
  }

  const dest = path.join(IMG_DIR, name + '.webp');

  await sharp(src)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(dest);

  const srcSize  = (await import('fs')).statSync(src).size;
  const destSize = (await import('fs')).statSync(dest).size;
  const saving   = (((srcSize - destSize) / srcSize) * 100).toFixed(0);

  console.log(`✓  ${name}.webp  (${(destSize / 1024).toFixed(1)} KB, ${saving}% más ligero)`);
  converted++;
}

console.log(`\nConvertidas: ${converted}/${targets.length}`);
