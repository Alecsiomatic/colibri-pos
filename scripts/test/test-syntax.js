const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'admin', 'products', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Buscando problemas de sintaxis...\n');

// Contar llaves, paréntesis y corchetes
let braces = 0;
let parens = 0;
let brackets = 0;
let inString = false;
let stringChar = '';

for (let i = 0; i < 340; i++) {
  const line = lines[i] || '';
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const prevChar = j > 0 ? line[j-1] : '';
    
    // Detectar strings
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
    }
    
    // Solo contar fuera de strings
    if (!inString) {
      if (char === '{') braces++;
      if (char === '}') braces--;
      if (char === '(') parens++;
      if (char === ')') parens--;
      if (char === '[') brackets++;
      if (char === ']') brackets--;
    }
  }
  
  // Mostrar estado en líneas clave
  if (i >= 310 && i <= 340) {
    if (braces < 0 || parens < 0 || brackets < 0) {
      console.log(`❌ Línea ${i+1}: DESBALANCEADO - { ${braces}, ( ${parens}, [ ${brackets}`);
      console.log(`   ${line.trim()}`);
    } else if (i === 336) {
      console.log(`Línea ${i+1}: { ${braces}, ( ${parens}, [ ${brackets}`);
      console.log(`   ${line.trim()}`);
    }
  }
}

console.log(`\n=== Estado final en línea 337 ===`);
console.log(`Llaves { }: ${braces}`);
console.log(`Paréntesis ( ): ${parens}`);
console.log(`Corchetes [ ]: ${brackets}`);

if (braces !== 1 || parens !== 1) {
  console.log('\n❌ ERROR: Hay llaves o paréntesis sin cerrar antes de la línea 337');
  console.log('Debería haber exactamente 1 llave abierta (de la función) y 1 paréntesis (del return)');
}
