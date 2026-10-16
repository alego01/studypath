/**
 * quiz.js — Dominio puro
 * Define las preguntas del quiz y la lógica de navegación.
 * No conoce nada de UI.
 */

export const QUESTIONS = [
  // Fase 1: Estilo de aprendizaje
  { phase: 'Estilo de aprendizaje', phaseColor: '#4facfe', key: 'style1',
    text: 'Cuando aprendes algo nuevo, ¿qué te funciona mejor?',
    options: ['Ver un video o diagrama visual', 'Escuchar a alguien explicarlo', 'Leer y tomar notas detalladas', 'Practicarlo yo mismo de inmediato'] },
  { phase: 'Estilo de aprendizaje', phaseColor: '#4facfe', key: 'style2',
    text: 'Para memorizar vocabulario nuevo en inglés, ¿qué haces?',
    options: ['Tarjetas con imágenes o colores', 'Repetirlo en voz alta varias veces', 'Escribirlo en listas o frases', 'Usarlo en conversaciones reales'] },
  { phase: 'Estilo de aprendizaje', phaseColor: '#4facfe', key: 'style3',
    text: '¿Cuándo te concentras mejor estudiando?',
    options: ['Con material visual (videos, esquemas)', 'Con música o audio de fondo', 'Con apuntes bien organizados', 'Moviéndome o haciendo algo a la vez'] },
  { phase: 'Estilo de aprendizaje', phaseColor: '#4facfe', key: 'attention',
    text: '¿Cuánto tiempo puedes estudiar antes de distraerte?',
    options: ['Menos de 15 minutos', '15-25 minutos', '30-45 minutos', 'Más de 45 minutos'] },
  { phase: 'Estilo de aprendizaje', phaseColor: '#4facfe', key: 'style4',
    text: 'Cuando algo no te entra, ¿qué haces?',
    options: ['Busco un video o imagen diferente', 'Pido que me lo expliquen', 'Lo reescribo con mis palabras', 'Lo intento aplicar en algo real'] },
  { phase: 'Estilo de aprendizaje', phaseColor: '#4facfe', key: 'distractor',
    text: '¿Cuál es tu mayor distractor al estudiar?',
    options: ['El celular y las notificaciones', 'El ruido del ambiente', 'No tener los materiales organizados', 'Estar mucho tiempo quieto'] },

  // Fase 2: Situación actual
  { phase: 'Tu situación', phaseColor: '#ff6b35', key: 'exam',
    text: '¿Qué examen o meta de inglés tienes?',
    options: ['IELTS', 'TOEFL', 'Cambridge (B2 First / C1)', 'Mejorar para trabajo o estudio'] },
  { phase: 'Tu situación', phaseColor: '#ff6b35', key: 'weakness',
    text: '¿Cuáles son tus habilidades más débiles?',
    options: ['Gramática y escritura', 'Lectura y vocabulario', 'Listening y pronunciación', 'Speaking y fluidez'] },
  { phase: 'Tu situación', phaseColor: '#ff6b35', key: 'timeframe',
    text: '¿Cuánto tiempo tienes para prepararte?',
    options: ['1 mes o menos', '2-3 meses', '4-6 meses', 'Más de 6 meses'] },
  { phase: 'Tu situación', phaseColor: '#ff6b35', key: 'days',
    text: '¿Cuántos días a la semana puedes estudiar?',
    options: ['1-2 días', '3-4 días', '5-6 días', 'Todos los días'] },

  // Fase 3: Preferencias
  { phase: 'Preferencias', phaseColor: '#00d68f', key: 'enjoy',
    text: '¿Qué tipo de actividades disfrutas más?',
    options: ['Ver series/películas en inglés', 'Escuchar podcasts o música', 'Leer artículos o libros', 'Conversar o jugar en inglés'] },
  { phase: 'Preferencias', phaseColor: '#00d68f', key: 'social',
    text: '¿Prefieres estudiar solo o con ayuda?',
    options: ['Solo, a mi ritmo', 'Con un tutor o profesor', 'Con compañeros de estudio', 'Mezcla de todo'] },
  { phase: 'Preferencias', phaseColor: '#00d68f', key: 'session_time',
    text: '¿Cuánto tiempo por sesión puedes dedicar?',
    options: ['10-15 minutos', '20-30 minutos', '45-60 minutos', 'Más de 1 hora'] },
  { phase: 'Preferencias', phaseColor: '#00d68f', key: 'device',
    text: '¿Tienes acceso a computadora o solo celular?',
    options: ['Solo celular', 'Celular y computadora', 'Solo computadora', 'Tablet principalmente'] },
];

/**
 * Obtiene una pregunta por índice
 */
export function getQuestion(index) {
  return QUESTIONS[index] || null;
}

/**
 * Total de preguntas
 */
export const TOTAL_QUESTIONS = QUESTIONS.length;

/**
 * Calcula el porcentaje de progreso del quiz
 */
export function quizProgress(currentIndex) {
  return Math.round(((currentIndex + 1) / TOTAL_QUESTIONS) * 100);
}
