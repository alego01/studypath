/**
 * app.js — Orquestador principal
 * Conecta todos los puertos y adaptadores.
 * Es el único lugar que conoce las implementaciones concretas.
 */
import Config from './config.js';
import { QUESTIONS, TOTAL_QUESTIONS, quizProgress } from './core/quiz.js';
import { buildUserProfile } from './core/profile.js';
import { calculateProgress, sessionId } from './core/plan.js';
import { GroqAdapter } from './adapters/ai/GroqAdapter.js';
import { GeminiAdapter } from './adapters/ai/GeminiAdapter.js';
import { OpenAIAdapter } from './adapters/ai/OpenAIAdapter.js';
import { PlanValidator } from './adapters/ai/PlanValidator.js';
import { DriveAdapter } from './adapters/storage/DriveAdapter.js';

// ===== STATE =====
let state = {
  user: null,           // Google user info
  accessToken: null,    // Google OAuth token
  storage: null,        // DriveAdapter instance
  userConfig: {},       // Provider, api keys
  quizAnswers: {},
  currentQ: 0,
  selectedIdx: null,
  efsetScore: null,
  plan: null,
  progress: {},
};

// ===== GOOGLE AUTH =====
function initGoogleAuth() {
  google.accounts.id.initialize({
    client_id: Config.GOOGLE_CLIENT_ID,
    callback: handleGoogleSignIn,
  });
  google.accounts.oauth2.initTokenClient({
    client_id: Config.GOOGLE_CLIENT_ID,
    scope: Config.GOOGLE_DRIVE_SCOPE,
    callback: handleTokenResponse,
  });
}

async function handleGoogleSignIn(response) {
  const payload = JSON.parse(atob(response.credential.split('.')[1]));
  state.user = { name: payload.name, email: payload.email, picture: payload.picture };
  requestDriveToken();
}

function requestDriveToken() {
  const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: Config.GOOGLE_CLIENT_ID,
    scope: Config.GOOGLE_DRIVE_SCOPE,
    callback: handleTokenResponse,
  });
  tokenClient.requestAccessToken({ prompt: '' });
}

async function handleTokenResponse(tokenResponse) {
  if (tokenResponse.error) { showToast('Error al conectar con Google Drive'); return; }
  state.accessToken = tokenResponse.access_token;
  state.storage = new DriveAdapter(state.accessToken);

  // Cargar configuración guardada
  state.userConfig = await state.storage.loadUserConfig();

  // Intentar cargar plan existente
  const existingPlan = await state.storage.loadPlan();
  if (existingPlan) {
    state.plan = existingPlan;
    state.progress = await state.storage.loadProgress();
    goTo('plan');
    renderPlan(existingPlan);
  } else {
    goTo('apikey');
  }
}

// ===== PROVIDER FACTORY =====
function createAdapter(provider, apiKey) {
  switch (provider) {
    case 'groq':    return new GroqAdapter(apiKey);
    case 'gemini':  return new GeminiAdapter(apiKey);
    case 'openai':  return new OpenAIAdapter(apiKey);
    default: throw new Error(`Proveedor desconocido: ${provider}`);
  }
}

function getValidatorAdapter(primaryProvider, primaryKey, secondaryKey) {
  // El validador siempre es un proveedor diferente al principal
  if (primaryProvider === 'groq' && secondaryKey?.gemini) {
    return new GeminiAdapter(secondaryKey.gemini);
  }
  if (primaryProvider === 'gemini' && secondaryKey?.groq) {
    return new GroqAdapter(secondaryKey.groq);
  }
  if (primaryProvider === 'openai' && secondaryKey?.gemini) {
    return new GeminiAdapter(secondaryKey.gemini);
  }
  // Si no hay segundo proveedor, el mismo modelo valida
  return createAdapter(primaryProvider, primaryKey);
}

// ===== GENERATE PLAN =====
async function generatePlan() {
  goTo('generating');
  animateGenSteps();

  const userProfile = buildUserProfile(state.quizAnswers, state.efsetScore || 45);
  const provider = state.userConfig.primaryProvider || 'groq';
  const primaryKey = state.userConfig.apiKeys?.[provider];
  const primary = createAdapter(provider, primaryKey);
  const validator = getValidatorAdapter(provider, primaryKey, state.userConfig.apiKeys);
  const planValidator = new PlanValidator(primary, validator);

  try {
    const { plan, validation, rounds } = await planValidator.generateAndValidate(
      userProfile,
      (status) => document.getElementById('gen-status').textContent = status
    );

    state.plan = plan;
    state.plan._meta = { userProfile, validation, rounds, generatedAt: new Date().toISOString() };

    await state.storage.savePlan(state.plan);
    renderPlan(state.plan);
    goTo('plan');
  } catch (err) {
    console.error(err);
    document.getElementById('plan-content').innerHTML = `
      <div class="error-box">
        <p>Error generando el plan: ${err.message}</p>
        <button class="retry-btn" onclick="generatePlan()">Reintentar</button>
      </div>`;
    goTo('plan');
  }
}

// ===== NAVIGATION =====
function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + screenId).classList.add('active');
  window.scrollTo(0, 0);
}

// ===== QUIZ =====
function renderQuestion() {
  const q = QUESTIONS[state.currentQ];
  document.getElementById('q-step-label').textContent = `Paso ${state.currentQ + 1} de ${TOTAL_QUESTIONS}`;
  document.getElementById('q-bar').style.width = quizProgress(state.currentQ) + '%';

  const tag = document.getElementById('q-phase-tag');
  tag.textContent = q.phase;
  tag.style.background = q.phaseColor + '22';
  tag.style.color = q.phaseColor;

  document.getElementById('q-text').textContent = q.text;
  const opts = document.getElementById('q-options');
  opts.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt' + (state.selectedIdx === i ? ' selected' : '');
    btn.innerHTML = `<span class="opt-letter">${letters[i]}</span>${opt}`;
    btn.onclick = () => {
      document.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.selectedIdx = i;
      document.getElementById('q-next').classList.add('ready');
    };
    opts.appendChild(btn);
  });

  const nextBtn = document.getElementById('q-next');
  nextBtn.classList.toggle('ready', state.selectedIdx !== null);
  nextBtn.textContent = state.currentQ === TOTAL_QUESTIONS - 1 ? 'Ir al examen de nivel →' : 'Siguiente →';
}

function quizNext() {
  if (state.selectedIdx === null) return;
  state.quizAnswers[QUESTIONS[state.currentQ].key] = {
    index: state.selectedIdx,
    value: QUESTIONS[state.currentQ].options[state.selectedIdx]
  };
  state.selectedIdx = null;
  if (state.currentQ < TOTAL_QUESTIONS - 1) {
    state.currentQ++;
    renderQuestion();
  } else {
    goTo('efset');
  }
}

function quizBack() {
  if (state.currentQ === 0) { goTo('apikey'); return; }
  state.currentQ--;
  state.selectedIdx = state.quizAnswers[QUESTIONS[state.currentQ].key]?.index ?? null;
  renderQuestion();
}

// ===== SESSION PROGRESS =====
async function toggleSession(id) {
  state.progress[id] = !state.progress[id];
  document.getElementById(id)?.classList.toggle('done', state.progress[id]);
  updatePlanProgress();
  await state.storage.saveProgress(state.progress);
  showToast(state.progress[id] ? '¡Sesión completada! 💪' : 'Sesión desmarcada');
}

function updatePlanProgress() {
  const { done, total, percent } = calculateProgress(state.plan, state.progress);
  document.getElementById('plan-pct').textContent = percent + '%';
  document.getElementById('plan-fill').style.width = percent + '%';
  if (percent === 100) showToast('¡Plan completado! 🏆');
}

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

// ===== GEN ANIMATION =====
function animateGenSteps() {
  const steps = ['gs1', 'gs2', 'gs3', 'gs4', 'gs5'];
  let i = 0;
  const timer = setInterval(() => {
    if (i > 0) {
      document.getElementById(steps[i - 1])?.classList.replace('active', 'done');
    }
    if (i < steps.length) {
      document.getElementById(steps[i])?.classList.add('active');
      i++;
    } else {
      clearInterval(timer);
    }
  }, 1200);
}

// ===== RENDER PLAN =====
function renderPlan(plan) {
  document.getElementById('plan-title').innerHTML = plan.titulo || 'Tu Plan Personalizado';
  const metaDiv = document.getElementById('plan-meta');
  metaDiv.innerHTML = '';
  (plan.meta_pills || []).forEach(pill => {
    const el = document.createElement('div');
    el.className = 'meta-pill';
    el.textContent = pill;
    metaDiv.appendChild(el);
  });

  const content = document.getElementById('plan-content');
  content.innerHTML = '';

  // Perfil
  if (plan.perfil_resumen) {
    const block = document.createElement('div');
    block.className = 'ai-block';
    block.innerHTML = `<h3>👤 Tu perfil</h3>
      <p>${plan.perfil_resumen}</p>
      ${plan.recomendacion_atencion ? `<p style="margin-top:10px;color:var(--gold)">⚡ ${plan.recomendacion_atencion}</p>` : ''}
      ${plan._meta?.validation ? `<p style="margin-top:8px;font-size:0.75rem;color:var(--muted)">Plan validado · Score ${plan._meta.validation.score}/100 · ${plan._meta.rounds} ronda(s)</p>` : ''}`;
    content.appendChild(block);
  }

  // Semanas
  const weeksTitle = document.createElement('div');
  weeksTitle.className = 'plan-section-title';
  weeksTitle.innerHTML = '📅 Tu plan semana a semana';
  content.appendChild(weeksTitle);

  (plan.semanas || []).forEach((week, wi) => {
    const wb = document.createElement('div');
    wb.className = 'week-block' + (wi === 0 ? ' open' : '');
    const sessionsHTML = (week.sesiones || []).map((s, si) => {
      const id = sessionId(wi, si);
      const isDone = state.progress[id] || false;
      return `
        <div class="session-check ${isDone ? 'done' : ''}" id="${id}" onclick="toggleSession('${id}')">
          <div class="sc-box">✓</div>
          <div class="sc-text">
            <strong style="display:block;margin-bottom:3px;color:var(--text)">${s.titulo}</strong>
            ${s.descripcion}
            ${s.recurso_url ? `<br><a href="${s.recurso_url}" target="_blank" onclick="event.stopPropagation()" style="color:var(--blue);font-size:0.78rem;display:inline-block;margin-top:5px">🔗 ${s.recurso_nombre || 'Recurso'}</a>` : ''}
          </div>
          <div class="sc-time">${s.duracion || '20 min'}</div>
        </div>`;
    }).join('');

    wb.innerHTML = `
      <div class="week-block-header" onclick="this.parentElement.classList.toggle('open')">
        <div class="wbh-left">
          <div class="wbh-num">SEMANA ${week.numero}</div>
          <div class="wbh-title">${week.titulo}</div>
        </div>
        <span class="wbh-arrow">▾</span>
      </div>
      <div class="week-block-body">
        <p style="margin-bottom:12px;color:var(--muted);font-size:0.82rem">${week.enfoque}</p>
        ${sessionsHTML}
      </div>`;
    content.appendChild(wb);
  });

  // Recursos
  if (plan.recursos_clave?.length) {
    const resTitle = document.createElement('div');
    resTitle.className = 'plan-section-title';
    resTitle.innerHTML = '🛠️ Recursos clave';
    content.appendChild(resTitle);
    plan.recursos_clave.forEach(r => {
      const a = document.createElement('a');
      a.className = 'resource-link';
      a.href = r.url || '#';
      a.target = '_blank';
      a.innerHTML = `<span class="resource-icon">${r.emoji}</span>
        <div><div class="resource-name">${r.nombre}</div>
        <div class="resource-desc">${r.descripcion} ${r.gratuito ? '· <span style="color:var(--green)">Gratis</span>' : ''}</div></div>
        <span class="resource-arrow">→</span>`;
      content.appendChild(a);
    });
  }

  // Consejo final
  if (plan.consejo_final) {
    const tip = document.createElement('div');
    tip.className = 'ai-block';
    tip.style.borderColor = 'rgba(255,107,53,0.3)';
    tip.innerHTML = `<h3>💡 Consejo para ti</h3><p>${plan.consejo_final}</p>`;
    content.appendChild(tip);
  }

  // Botón nuevo plan
  const restart = document.createElement('button');
  restart.className = 'restart-btn';
  restart.textContent = '↺ Crear un nuevo plan';
  restart.onclick = async () => {
    state.plan = null;
    state.progress = {};
    state.quizAnswers = {};
    state.currentQ = 0;
    state.efsetScore = null;
    document.getElementById('plan-content').innerHTML = '';
    document.getElementById('plan-meta').innerHTML = '';
    renderQuestion();
    goTo('quiz');
  };
  content.appendChild(restart);

  updatePlanProgress();
}

// ===== INIT =====
window.addEventListener('load', () => {
  initGoogleAuth();
  renderQuestion();

  // Exponer funciones necesarias al HTML
  window.goTo = goTo;
  window.quizNext = quizNext;
  window.quizBack = quizBack;
  window.toggleSession = toggleSession;
  window.generatePlan = generatePlan;
});
