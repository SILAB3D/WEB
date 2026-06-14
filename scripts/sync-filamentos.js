// scripts/sync-filamentos.js
// Regenera data/filamentos.json (checkpoint de respaldo) a partir de la tabla
// 'filamentos' de Supabase — solo los marcados como visibles.
// Lo ejecuta el GitHub Action cada hora; la web lee Supabase en vivo y usa
// este JSON solo si Supabase no responde.
// La clave publishable es pública (ya está en la web); se puede sobreescribir por env.
const fs = require('fs');
const path = require('path');

const URL = (process.env.SUPABASE_URL || 'https://yyezkumbjqnushwgqkzf.supabase.co').replace(/\/$/, '');
const KEY = process.env.SUPABASE_KEY || 'sb_publishable_S-YCLKYozH7T9DFE1gMtUw_1jWLZnIf';

async function main() {
  const endpoint = URL + '/rest/v1/filamentos?select=material,nombre,hex&visible=eq.true&order=material.asc,nombre.asc';
  const res = await fetch(endpoint, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
  if (!res.ok) throw new Error('Supabase ' + res.status + ': ' + (await res.text()));
  const rows = await res.json();

  // Colapsa PLA / PLA PREMIUM en 'PLA' (con premium) y PETG en 'PETG',
  // igual que hace la web, para que el respaldo sea idéntico.
  const grupos = {};
  for (const r of rows) {
    const principal = String(r.material || '').toUpperCase();
    const key = principal.indexOf('PLA') === 0 ? 'PLA' : (principal.indexOf('PETG') === 0 ? 'PETG' : null);
    if (!key) continue;
    if (!grupos[key]) grupos[key] = { nombre: key, colores: [] };
    const color = { nombre: r.nombre, hex: r.hex || '#cccccc' };
    if (principal === 'PLA PREMIUM') color.premium = true;
    grupos[key].colores.push(color);
  }

  const out = { filamentos: Object.keys(grupos).map((k) => grupos[k]) };
  const outPath = path.join(__dirname, '..', 'data', 'filamentos.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log('OK:', rows.length, 'colores →', Object.keys(grupos).join(', '), '→', outPath);
}
main().catch((e) => { console.error(e); process.exit(1); });
