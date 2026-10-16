const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'i2A_School ERP & Managment', 'src', 'components', 'layout', 'Header.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Lines are 1-indexed. Remove lines 737 to 971 (indices 736 to 970)
// Keep lines 1-736 (indices 0-735) and lines 972+ (indices 971+)
const newLines = [
  ...lines.slice(0, 735),
  ...lines.slice(971)
];

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('Done. New line count:', newLines.length);
