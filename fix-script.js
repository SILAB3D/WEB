const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'pages', 'materiales-pruebas.html');
let content = fs.readFileSync(filePath, 'utf8');

// Remove the script.js loading line and comment
content = content.replace(/\s*<!-- Original script\.js for quote form logic -->\s*\n\s*<script defer src="\.\.\/js\/script\.js"><\/script>\s*/g, '\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Removed script.js loading');
