const fs = require('fs');

const content = fs.readFileSync('app/admin/products/page.tsx', 'utf8');
const lines = content.split('\n');

// Contar llaves y paréntesis
let braces = 0;
let parentheses = 0;
let brackets = 0;

for (let i = 0; i < Math.min(340, lines.length); i++) {
  const line = lines[i];
  
  for (const char of line) {
    if (char === '{') braces++;
    if (char === '}') braces--;
    if (char === '(') parentheses++;
    if (char === ')') parentheses--;
    if (char === '[') brackets++;
    if (char === ']') brackets--;
  }
  
  if (i === 335 || i === 336 || i === 337) {
    console.log(`Línea ${i+1}: braces=${braces}, parentheses=${parentheses}, brackets=${brackets}`);
    console.log(`  ${line.trim()}`);
  }
}

console.log(`\nEstado en línea 337:`);
console.log(`  Llaves {} sin cerrar: ${braces}`);
console.log(`  Paréntesis () sin cerrar: ${parentheses}`);
console.log(`  Corchetes [] sin cerrar: ${brackets}`);
