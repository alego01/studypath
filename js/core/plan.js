/**
 * plan.js — Dominio puro
 * Define la estructura del plan y lógica de progreso.
 * No conoce nada de IA, UI ni almacenamiento.
 */

/**
 * Calcula el progreso general del plan
 * @param {object} plan
 * @param {object} progress - { sessionId: boolean }
 * @returns {{ done: number, total: number, percent: number }}
 */
export function calculateProgress(plan, progress = {}) {
  const total = (plan.semanas || [])
    .reduce((sum, w) => sum + (w.sesiones || []).length, 0);
  const done = Object.values(progress).filter(Boolean).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { done, total, percent };
}

/**
 * Genera un ID único para una sesión
 */
export function sessionId(weekIndex, sessionIndex) {
  return `w${weekIndex}_s${sessionIndex}`;
}

/**
 * Valida que un plan tiene la estructura mínima requerida
 * @param {object} plan
 * @returns {boolean}
 */
export function isPlanValid(plan) {
  return (
    plan &&
    typeof plan.titulo === 'string' &&
    Array.isArray(plan.semanas) &&
    plan.semanas.length > 0 &&
    plan.semanas.every(w =>
      w.titulo && Array.isArray(w.sesiones) && w.sesiones.length > 0
    )
  );
}

/**
 * Construye el prompt de generación del plan
 */
export function buildGenerationPrompt(profileText) {
  return `Eres un experto certificado en enseñanza de inglés con conocimiento profundo del marco CEFR y metodologías como TBLT y communicative language teaching.

Crea un plan de estudio de inglés personalizado en español para este estudiante:

${profileText}

IMPORTANTE: El plan debe estar perfectamente alineado al nivel CEFR detectado y al examen objetivo. Cada sesión debe ser realista para el tiempo de atención del estudiante.

Responde SOLO con JSON válido, sin markdown ni texto extra:

{
  "titulo": "Nombre motivador y específico del plan",
  "meta_principal": "Objetivo concreto y medible",
  "perfil_resumen": "2-3 oraciones describiendo el perfil único de este estudiante",
  "recomendacion_atencion": "Estrategia específica si tiene dificultades de atención, o string vacío",
  "nivel_detectado": "Nivel CEFR actual",
  "nivel_objetivo": "Nivel CEFR a alcanzar",
  "meta_pills": ["Dato 1", "Dato 2", "Dato 3", "Dato 4"],
  "semanas": [
    {
      "numero": 1,
      "titulo": "Título de la semana",
      "enfoque": "Descripción del enfoque pedagógico",
      "objetivos": ["Objetivo 1", "Objetivo 2"],
      "sesiones": [
        {
          "titulo": "Título concreto de la sesión",
          "descripcion": "Instrucciones paso a paso de qué hacer exactamente",
          "duracion": "20 min",
          "tipo": "gramatica|escritura|vocabulario|lectura|listening|speaking",
          "recurso_nombre": "Nombre real del recurso",
          "recurso_url": "https://url-real-y-funcional.com"
        }
      ]
    }
  ],
  "recursos_clave": [
    {
      "emoji": "✅",
      "nombre": "Nombre del recurso",
      "descripcion": "Para qué usarlo exactamente",
      "url": "https://url-real.com",
      "gratuito": true
    }
  ],
  "consejo_final": "Consejo personalizado y motivador para este estudiante específico"
}`;
}

/**
 * Construye el prompt de validación del plan
 */
export function buildValidationPrompt(plan, profileText) {
  return `Eres un evaluador experto en planes de estudio de inglés y el marco CEFR. 
  
Evalúa críticamente este plan de estudio:

PERFIL DEL ESTUDIANTE:
${profileText}

PLAN A EVALUAR:
${JSON.stringify(plan, null, 2)}

Evalúa estos criterios:
1. ¿El plan es apropiado para el nivel CEFR del estudiante?
2. ¿Las sesiones respetan el tiempo de atención indicado?
3. ¿Los recursos son reales, gratuitos y accesibles?
4. ¿La progresión semanal es lógica y pedagógicamente correcta?
5. ¿El plan es alcanzable en el tiempo disponible?
6. ¿Hay alucinaciones (recursos inventados, URLs falsas)?

Responde SOLO con JSON válido:

{
  "valid": true/false,
  "score": 0-100,
  "issues": ["Problema 1 si existe", "Problema 2 si existe"],
  "strengths": ["Fortaleza 1", "Fortaleza 2"],
  "improvedPlan": { ... plan corregido si valid es false, null si valid es true ... }
}`;
}
