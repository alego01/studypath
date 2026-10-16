/**
 * profile.js — Dominio puro
 * Construye el perfil del usuario a partir de las respuestas del quiz y examen.
 * No conoce nada de IA, UI ni almacenamiento.
 */

const STYLE_MAP = { 0: 'Visual', 1: 'Auditivo', 2: 'Lecto-escritor', 3: 'Kinestésico' };

const CEFR_LEVELS = {
  efset: {
    '0-30':  'A1-A2',
    '31-40': 'B1',
    '41-55': 'B1-B2',
    '56-70': 'B2-C1',
    '71-100': 'C1-C2',
  }
};

/**
 * Detecta el estilo de aprendizaje dominante
 * @param {object} answers - Respuestas del quiz
 * @returns {string}
 */
export function detectLearningStyle(answers) {
  const styleKeys = ['style1', 'style2', 'style3', 'style4'];
  const counts = [0, 1, 2, 3].map(i => ({
    style: STYLE_MAP[i],
    count: styleKeys.filter(k => answers[k]?.index === i).length
  }));
  counts.sort((a, b) => b.count - a.count);
  return counts[0].style;
}

/**
 * Convierte el score de EF SET a nivel CEFR
 * @param {number} score
 * @returns {string}
 */
export function efsetToCEFR(score) {
  for (const [range, level] of Object.entries(CEFR_LEVELS.efset)) {
    const [min, max] = range.split('-').map(Number);
    if (score >= min && score <= max) return level;
  }
  return 'B1';
}

/**
 * Construye el perfil completo del usuario
 * @param {object} quizAnswers
 * @param {number} efsetScore
 * @returns {object} UserProfile
 */
export function buildUserProfile(quizAnswers, efsetScore) {
  const learningStyle = detectLearningStyle(quizAnswers);
  const cefrLevel = efsetToCEFR(efsetScore);

  return {
    learningStyle,
    cefrLevel,
    efsetScore,
    attention: quizAnswers.attention?.value || '15-25 minutos',
    distractor: quizAnswers.distractor?.value || 'No especificado',
    exam: quizAnswers.exam?.value || 'IELTS',
    weakness: quizAnswers.weakness?.value || 'Gramática y escritura',
    timeframe: quizAnswers.timeframe?.value || '1-3 meses',
    days: quizAnswers.days?.value || '3-4 días',
    sessionTime: quizAnswers.session_time?.value || '20-30 minutos',
    enjoy: quizAnswers.enjoy?.value || 'No especificado',
    social: quizAnswers.social?.value || 'Solo',
    device: quizAnswers.device?.value || 'Celular',
    hasAttentionDifficulties: ['Menos de 15 minutos', '15-25 minutos'].includes(quizAnswers.attention?.value),
  };
}

/**
 * Convierte el perfil a texto para el prompt de IA
 * @param {object} profile
 * @returns {string}
 */
export function profileToPromptText(profile) {
  return `
- Estilo de aprendizaje dominante: ${profile.learningStyle}
- Nivel actual (EF SET ${profile.efsetScore}/100): ${profile.cefrLevel}
- Examen objetivo: ${profile.exam}
- Habilidades más débiles: ${profile.weakness}
- Tiempo disponible: ${profile.timeframe}
- Días de estudio por semana: ${profile.days}
- Tiempo por sesión: ${profile.sessionTime}
- Actividades favoritas: ${profile.enjoy}
- Prefiere estudiar: ${profile.social}
- Dispositivo principal: ${profile.device}
- Tiempo de atención: ${profile.attention}
- Dificultades de atención: ${profile.hasAttentionDifficulties ? 'Sí — adaptar sesiones cortas' : 'No'}
  `.trim();
}
