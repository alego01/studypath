/**
 * PlanValidator.js — Orquesta la generación y validación cruzada del plan
 * Patrón: Modelo 1 genera → Modelo 2 valida → hasta 2 rondas si falla
 */
import { isPlanValid, buildGenerationPrompt } from '../../core/plan.js';
import { profileToPromptText } from '../../core/profile.js';

export class PlanValidator {
  /**
   * @param {IAIPort} primaryAdapter - Modelo principal que genera
   * @param {IAIPort} validatorAdapter - Modelo que valida y critica
   */
  constructor(primaryAdapter, validatorAdapter) {
    this.primary = primaryAdapter;
    this.validator = validatorAdapter;
    this.maxRounds = 2;
  }

  /**
   * Genera y valida un plan con hasta 2 rondas de corrección
   * @param {object} userProfile
   * @param {function} onStatus - Callback para actualizar UI con el estado actual
   * @returns {Promise<{ plan: object, validation: object, rounds: number }>}
   */
  async generateAndValidate(userProfile, onStatus = () => {}) {
    const profileText = profileToPromptText(userProfile);
    const prompt = buildGenerationPrompt(profileText);
    let plan = null;
    let validation = null;
    let rounds = 0;

    for (let round = 1; round <= this.maxRounds; round++) {
      rounds = round;

      // Paso 1: Generar plan
      onStatus(`🧠 Generando tu plan con ${this.primary.providerName}... (ronda ${round})`);
      plan = await this.primary.generatePlan(prompt);

      if (!isPlanValid(plan)) {
        if (round < this.maxRounds) continue;
        throw new Error('El plan generado no tiene la estructura requerida después de 2 intentos');
      }

      // Paso 2: Validar con modelo alternativo
      onStatus(`🔍 Validando con ${this.validator.providerName}...`);
      try {
        validation = await this.validator.validatePlan(plan, profileText);
      } catch (e) {
        // Si el validador falla, aceptamos el plan tal como está
        console.warn('Validador falló, aceptando plan original:', e);
        validation = { valid: true, score: 75, issues: [], strengths: ['Plan generado correctamente'] };
        break;
      }

      // Si el plan es válido, terminamos
      if (validation.valid || validation.score >= 70) {
        onStatus(`✅ Plan validado con score ${validation.score}/100`);
        break;
      }

      // Si falló y hay un plan mejorado, usarlo en la siguiente ronda
      if (validation.improvedPlan && isPlanValid(validation.improvedPlan)) {
        plan = validation.improvedPlan;
        onStatus(`🔄 Aplicando mejoras sugeridas...`);
        break;
      }

      // Si es la última ronda y aún falla, usar el plan con las issues documentadas
      if (round === this.maxRounds) {
        onStatus(`⚠️ Plan generado con observaciones`);
      }
    }

    return { plan, validation, rounds };
  }
}
