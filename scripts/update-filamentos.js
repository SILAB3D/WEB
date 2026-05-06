// scripts/update-filamentos.js
// Usage: node update-filamentos.js [SHEET_ID] [SHEET_NAME]
// The script fetches OpenSheet and writes data/filamentos.json in the nested format.

const fs = require('fs');
const path = require('path');

const sheetId = process.argv[2] || process.env.SHEET_ID || '1kWsHasAfQa7kAqSKHue72_kV3ZS_7SElBD6R8lmjoPM';
const sheetName = process.argv[3] || process.env.SHEET_NAME || 'filamentos';
const opensheetUrl = `https://opensheet.elk.sh/${encodeURIComponent(sheetId)}/${encodeURIComponent(sheetName)}`;
const outPath = path.join(__dirname, '..', 'data', 'filamentos.json');

async function main() {
  console.log('Fetching', opensheetUrl);
  const res = await fetch(opensheetUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch OpenSheet: ' + res.statusText);
  const json = await res.json();
  if (!Array.isArray(json)) {
    // assume already nested
    const out = json;
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
    console.log('Wrote nested filamentos to', outPath);
    return;
  }

  const rows = json;
  const first = rows[0] || {};
  // if rows look like color rows (accept Spanish headers)
  if (first.hex || first.color || first.color_name || first.nombre_color || first.color_hex || first['Código HEX'] || first['Color'] || first['Tipo']) {
    const map = Object.create(null);
    rows.forEach(r => {
      const rawTipo = (r.Tipo || r.tipo || r.material || r.nombre || r.material_name || '').toString().trim();
      if (!rawTipo) return;
      if (/^TOTAL\b/i.test(rawTipo)) return;
      const material = rawTipo || 'UNKNOWN';
      const subtype = (r.Subtipo || r.subtipo || r.subtype || '').toString().trim();
      const colorName = (r.Color || r.color || r.color_name || r.nombre || r.name || '').toString().trim();
      if (!colorName) return;
      const hexRaw = (r['Código HEX'] || r['Codigo HEX'] || r.hex || r.hex_code || r.color_hex || '').toString().trim();
      const premiumFlag = (r.Premium || r.premium || r.isPremium || '').toString().toLowerCase();
      const offerFlag = (r.Offer || r.offer || r.oferta || '').toString().toLowerCase();
      const premium = premiumFlag === 'true' || premiumFlag === '1' || premiumFlag === 'yes' || premiumFlag === 'si' || /premium/i.test(subtype);
      const offer = offerFlag === 'true' || offerFlag === '1' || offerFlag === 'yes' || offerFlag === 'si';
      let hex;
      if (hexRaw.indexOf(',') >= 0) {
        hex = hexRaw.split(',').map(h => { const t = h.trim(); return t.startsWith('#') ? t : ('#' + t); });
      } else {
        const t = hexRaw || '#cccccc';
        hex = t.startsWith('#') ? t : ('#' + t);
      }
      const colorObj = { nombre: colorName, hex: hex };
      if (premium) colorObj.premium = true;
      if (offer) colorObj.offer = true;
      if (!map[material]) map[material] = { nombre: material, colores: [] };
      map[material].colores.push(colorObj);
    });
    const filamentos = Object.keys(map).map(k => map[k]);
    const out = { filamentos };
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
    console.log('Wrote', outPath);
    return;
  }

  // fallback: write as array
  fs.writeFileSync(outPath, JSON.stringify({ filamentos: json }, null, 2), 'utf8');
  console.log('Wrote fallback filamentos.json');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
