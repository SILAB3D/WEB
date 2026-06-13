// ============================================================
//  Supabase Edge Function:  limpiar-solicitudes
//  Borra del bucket 'solicitudes' los archivos con más de
//  DIAS_RETENCION días (15 por defecto). Pensada para ejecutarse
//  a diario mediante Supabase Cron (pg_cron + pg_net).
//
//  Usa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY, que Supabase
//  inyecta automáticamente como variables de entorno en las
//  funciones (no hay que configurarlas como secretos).
//
//  Desplegar:
//    supabase functions deploy limpiar-solicitudes
//  Opcionales (secretos):
//    supabase secrets set DIAS_RETENCION=15
//    supabase secrets set PURGE_KEY=una_clave_secreta   // protege la llamada
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = Deno.env.get("BUCKET") ?? "solicitudes";
const DIAS_RETENCION = Number(Deno.env.get("DIAS_RETENCION") ?? "15");
const PURGE_KEY = Deno.env.get("PURGE_KEY") ?? "";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // Protección opcional: si PURGE_KEY está definida, exige la cabecera correcta.
  if (PURGE_KEY && req.headers.get("x-purge-key") !== PURGE_KEY) {
    return json({ ok: false, error: "No autorizado" }, 401);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    return json({ ok: false, error: "Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" }, 500);
  }

  const sb = createClient(url, serviceKey);
  const limite = Date.now() - DIAS_RETENCION * 24 * 60 * 60 * 1000;

  const aBorrar: string[] = [];
  const PAGE = 100;
  let offset = 0;

  // Recorre el bucket por páginas (los archivos están en la raíz).
  while (true) {
    const { data, error } = await sb.storage.from(BUCKET).list("", {
      limit: PAGE,
      offset,
      sortBy: { column: "created_at", order: "asc" },
    });
    if (error) return json({ ok: false, error: error.message }, 500);
    if (!data || data.length === 0) break;

    for (const obj of data) {
      if (!obj.name) continue; // salta carpetas/placeholders
      const created = obj.created_at ? Date.parse(obj.created_at) : NaN;
      if (!Number.isNaN(created) && created < limite) {
        aBorrar.push(obj.name);
      }
    }

    if (data.length < PAGE) break;
    offset += PAGE;
  }

  let borrados = 0;
  for (let i = 0; i < aBorrar.length; i += 100) {
    const lote = aBorrar.slice(i, i + 100);
    const { error } = await sb.storage.from(BUCKET).remove(lote);
    if (!error) borrados += lote.length;
  }

  return json({ ok: true, dias_retencion: DIAS_RETENCION, encontrados: aBorrar.length, borrados });
});
