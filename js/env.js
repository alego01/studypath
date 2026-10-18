// env.js — Carga variables de entorno en local, no-op en producción
const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

export async function loadEnv() {
  if (!isLocal) return {};
  try {
    const res = await fetch('/__env');
    return await res.json();
  } catch {
    console.warn('[env] No se pudo cargar /__env — corre con: node dev-server.js');
    return {};
  }
}
