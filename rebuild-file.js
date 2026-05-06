const fs = require('fs');

// Read the original materiales.html
const materialePath = 'h:\\icuas\\Documents\\SILAB 3D\\WEB\\pages\\materiales.html';
let content = fs.readFileSync(materialePath, 'utf8');

// Remove the script.js loading
const scriptJsPattern = /\s*<!-- Original script\.js for quote form logic -->\s*\n\s*<script defer src="\.\.\/js\/script\.js"><\/script>\s*/;
content = content.replace(scriptJsPattern, '\n');

// Add the dynamic script
const dynamicScript = `
  <!-- Dynamic catalog from OpenSheet -->
  <script defer>
    async function fetchFilamentosFromSheet() {
      if (!window.FILAMENTS_SHEET) return null;
      try {
        const url = \`https://opensheet.elk.sh/\${window.FILAMENTS_SHEET.id}/\${encodeURIComponent(window.FILAMENTS_SHEET.sheet)}\`;
        const response = await fetch(url);
        if (!response.ok) return null;
        const rows = await response.json();
        
        const filamentos = [];
        const materials = {};
        
        rows.forEach(row => {
          const tipo = (row.Tipo || row.tipo || '').trim();
          const subtipo = (row.Subtipo || row.subtipo || '').trim();
          const color = (row.Color || row.color || '').trim();
          const hexRaw = (row['Código HEX'] || row['código hex'] || row['Codigo HEX'] || '').trim();
          
          if (!tipo || /^TOTAL\\b/i.test(color)) return;
          if (!materials[tipo]) materials[tipo] = { nombre: tipo, colores: [] };
          
          let hex = hexRaw;
          if (hex && !hex.startsWith('#')) hex = '#' + hex;
          const isPremium = /premium/i.test(subtipo);
          
          materials[tipo].colores.push({ nombre: color, hex: hex || '#cccccc', premium: isPremium });
        });
        
        Object.values(materials).forEach(m => filamentos.push(m));
        return { filamentos };
      } catch (e) {
        console.warn('OpenSheet error:', e);
        return null;
      }
    }

    function buildColorCardHtml(color) {
      const lowerName = String(color.nombre || '').toLowerCase();
      const isWhite = /^#?fff(?:fff)?$/i.test(color.hex) || /white/i.test(lowerName);
      let circleStyle = 'background-color:' + color.hex + ';';
      if (isWhite) circleStyle += ' border:2px solid #ddd;';
      return '<div class="color-card" data-color="' + color.hex + '">' +
        '<div class="color-circle" style="' + circleStyle + '"></div>' +
        '<model-viewer class="color-model" src="../assets/vase_spiral.glb" loading="eager" alt="Vase" scale="0.3 0.3 0.3" auto-rotate auto-rotate-delay="0" rotation-per-second="30deg" camera-orbit="45deg 75deg 5.5m" field-of-view="55deg" max-camera-orbit="auto auto 6m" disable-zoom></model-viewer>' +
        '<h4>' + color.nombre + '</h4></div>';
    }

    async function populateCatalogFromSheet() {
      const data = await fetchFilamentosFromSheet();
      if (!data || !data.filamentos) return;

      const filamentos = data.filamentos || [];
      let plaBasicos = [], plaPremium = [], petgColores = [];

      filamentos.forEach(material => {
        const materialName = String(material.nombre || '').toUpperCase();
        const colors = Array.isArray(material.colores) ? material.colores : [];
        
        if (materialName === 'PLA') {
          colors.forEach(c => { if (c.premium) plaPremium.push(c); else plaBasicos.push(c); });
        } else if (materialName === 'PETG') {
          petgColores = petgColores.concat(colors);
        }
      });

      const plaGrids = document.querySelectorAll('#pla .colores-grid');
      if (plaGrids[0]) plaGrids[0].innerHTML = plaBasicos.map(c => buildColorCardHtml(c)).join('');

      const premiumSection = document.querySelector('.premium-section');
      if (plaPremium.length > 0 && premiumSection) {
        premiumSection.style.display = 'block';
        const premiumGrid = premiumSection.querySelector('.colores-grid');
        if (premiumGrid) premiumGrid.innerHTML = plaPremium.map(c => buildColorCardHtml(c)).join('');
      } else if (premiumSection) {
        premiumSection.style.display = 'none';
      }

      const petgGrid = document.querySelector('#petg .colores-grid');
      if (petgGrid) petgGrid.innerHTML = petgColores.map(c => buildColorCardHtml(c)).join('');
    }

    document.addEventListener('DOMContentLoaded', populateCatalogFromSheet);
  </script>`;

content = content.replace('</body>', dynamicScript + '\n</body>');

const outputPath = 'h:\\icuas\\Documents\\SILAB 3D\\WEB\\pages\\materiales-pruebas.html';
fs.writeFileSync(outputPath, content, 'utf8');
console.log('✓ materiales-pruebas.html created successfully');
