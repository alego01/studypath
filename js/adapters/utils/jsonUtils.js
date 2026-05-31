/**
 * jsonUtils.js — Utilidades para parseo robusto de JSON
 * Maneja JSON truncado o malformado devuelto por modelos de IA
 */

export function parseJSON(raw) {
  let text = raw.replace(/```json|```/g, '').trim();
  const start = text.indexOf('{');
  let end = text.lastIndexOf('}');
  if (start === -1) throw new Error('No JSON object found in response');
  if (end === -1 || end < start) {
    text = repairJSON(text.slice(start));
  } else {
    text = text.slice(start, end + 1);
  }
  try {
    return JSON.parse(text);
  } catch {
    return JSON.parse(repairJSON(text));
  }
}

export function repairJSON(str) {
  let result = str;
  let opens = 0, openArr = 0;
  let inString = false, escape = false;
  for (let i = 0; i < result.length; i++) {
    const c = result[i];
    if (escape) { escape = false; continue; }
    if (c === '\\' && inString) { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '{') opens++;
    else if (c === '}') opens--;
    else if (c === '[') openArr++;
    else if (c === ']') openArr--;
  }
  if (inString) result += '"';
  result = result.replace(/,\s*$/, '');
  for (let i = 0; i < openArr; i++) result += ']';
  for (let i = 0; i < opens; i++) result += '}';
  return result;
}
