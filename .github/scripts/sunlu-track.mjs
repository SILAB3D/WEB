// Sunlu stock watch — captura filamentos con envío a Europa y registra cambios.
// Se ejecuta en GitHub Actions (node 20+, fetch global). No requiere dependencias.
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://store.sunlu.com/products.json';
const OUTDIR = path.join('3dproject', 'data', 'sunlu');
const LATEST = path.join(OUTDIR, 'latest.json');
const CHANGES = path.join(OUTDIR, 'changes.json');
const MAX_CHANGES = 4000;

async function fetchAll() {
  const out = [];
  for (let page = 1; page <= 20; page++) {
    const url = BASE + '?limit=250&page=' + page;
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (SunluStockWatch; +https://silab3d.com)' } });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' en ' + url);
    const json = await res.json();
    const arr = json.products || [];
    out.push(...arr);
    if (arr.length < 250) break;
    await new Promise(r => setTimeout(r, 800));
  }
  return out;
}

function euVariants(p) {
  const opts = p.options || [];
  const idx = opts.findIndex(o => (o.values || []).some(v => /europe/i.test(String(v))));
  const vars = p.variants || [];
  if (idx < 0) return vars; // sin opción de envío: todas
  const key = 'option' + (idx + 1);
  return vars.filter(v => /europe/i.test(String(v[key] || '')));
}

function cleanVt(t) { return String(t || '').replace(/ship to europe\s*\/?\s*/i, '').replace(/^\s*\/\s*/, '').trim() || 'Único'; }

function snapshot(products) {
  const items = [];
  for (const p of products) {
    if (String(p.product_type || '') !== '3D Printer Filaments') continue;
    const vs = euVariants(p);
    if (!vs.length) continue;
    const img = (p.images && p.images[0] && p.images[0].src) || '';
    items.push({
      id: p.id, handle: p.handle, title: p.title, img,
      variants: vs.map(v => ({
        id: v.id, sku: v.sku || '', vt: cleanVt(v.title),
        price: String(v.price || ''), cap: String(v.compare_at_price || ''),
        av: !!v.available
      }))
    });
  }
  items.sort((a, b) => a.id - b.id);
  return items;
}

function readJson(f, fallback) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return fallback; } }

function diff(prevProducts, nextProducts, ts) {
  const ev = [];
  const pv = new Map(); // vid -> {p, v}
  for (const p of prevProducts) for (const v of p.variants) pv.set(String(v.id), { p, v });
  const seen = new Set();
  for (const p of nextProducts) {
    for (const v of p.variants) {
      const k = String(v.id); seen.add(k);
      const old = pv.get(k);
      const base = { ts, pid: p.id, vid: v.id, product: p.title, variant: v.vt, sku: v.sku, price: v.price };
      if (!old) { ev.push({ ...base, type: 'nuevo' }); continue; }
      if (!old.v.av && v.av) ev.push({ ...base, type: 'repuesto' });
      else if (old.v.av && !v.av) ev.push({ ...base, type: 'agotado' });
      if (String(old.v.price) !== String(v.price)) ev.push({ ...base, type: 'precio', from: String(old.v.price), to: String(v.price) });
    }
  }
  for (const [k, old] of pv) {
    if (!seen.has(k)) ev.push({ ts, pid: old.p.id, vid: old.v.id, product: old.p.title, variant: old.v.vt, sku: old.v.sku, price: old.v.price, type: 'retirado' });
  }
  return ev;
}

async function main() {
  fs.mkdirSync(OUTDIR, { recursive: true });
  const products = snapshot(await fetchAll());
  if (!products.length) throw new Error('0 filamentos capturados: aborto para no vaciar el snapshot.');
  const prev = readJson(LATEST, null);
  const ts = Date.now();
  let changes = readJson(CHANGES, []);
  if (!Array.isArray(changes)) changes = [];
  if (prev && Array.isArray(prev.products) && prev.products.length) {
    const ev = diff(prev.products, products, ts);
    if (ev.length) changes = ev.concat(changes).slice(0, MAX_CHANGES);
    console.log('Cambios detectados:', ev.length);
  } else {
    console.log('Primera captura: sin diff.');
  }
  fs.writeFileSync(LATEST, JSON.stringify({ fetched_at: new Date(ts).toISOString(), products }), 'utf8');
  fs.writeFileSync(CHANGES, JSON.stringify(changes), 'utf8');
  const nv = products.reduce((a, p) => a + p.variants.length, 0);
  console.log('Snapshot OK:', products.length, 'productos /', nv, 'variantes EU.');
}

main().catch(e => { console.error(e); process.exit(1); });
