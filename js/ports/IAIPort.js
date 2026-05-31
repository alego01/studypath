/**
 * IAIPort — Puerto de IA (interfaz)
 * Cualquier adaptador de IA debe implementar estos métodos.
 * El dominio nunca conoce al proveedor concreto.
 */
export class IAIPort {
  /**
   * Genera un plan de estudio basado en el perfil del usuario
   * @param {string} prompt
   * @returns {Promise<object>} Plan en formato JSON
   */
  async generatePlan(prompt) {
    throw new Error('generatePlan() debe ser implementado por el adaptador');
  }

  /**
   * Valida y critica un plan generado
   * @param {object} plan
   * @param {object} userProfile
   * @returns {Promise<{valid: boolean, score: number, issues: string[], improvedPlan: object}>}
   */
  async validatePlan(plan, userProfile) {
    throw new Error('validatePlan() debe ser implementado por el adaptador');
  }

  /**
   * Nombre del proveedor para mostrar en UI
   * @returns {string}
   */
  get providerName() {
    throw new Error('providerName debe ser implementado por el adaptador');
  }
}
