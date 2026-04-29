const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const pagesDir = path.join(rootDir, 'pages');

const productosHtmlPath = path.join(pagesDir, 'productos.html');
const productosContent = fs.readFileSync(productosHtmlPath, 'utf-8');

const footerRegex = /<footer class="footer">[\s\S]*?<\/footer>/i;
const footerMatch = productosContent.match(footerRegex);

if (!footerMatch) {
    console.error('Footer not found in productos.html');
    process.exit(1);
}

const footerStr = footerMatch[0];

// The footer contains relative links like `href="terminos.html"`
// For index.html, we need `href="pages/terminos.html"`
const footerStrForIndex = footerStr
    .replace(/href="terminos.html"/g, 'href="pages/terminos.html"')
    .replace(/href="privacidad.html"/g, 'href="pages/privacidad.html"')
    .replace(/href="aviso-legal.html"/g, 'href="pages/aviso-legal.html"');

const filesToProcess = [
    path.join(rootDir, 'index.html'),
    ...fs.readdirSync(pagesDir).filter(f => f.endsWith('.html') && f !== 'productos.html').map(f => path.join(pagesDir, f))
];

for (const filePath of filesToProcess) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace the footer
    const newFooter = filePath.endsWith('index.html') ? footerStrForIndex : footerStr;
    
    const newContent = content.replace(footerRegex, newFooter);
    
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`Updated footer in: ${filePath}`);
    } else {
        console.log(`No changes needed for: ${filePath}`);
    }
}

console.log('Done replacing footers.');
