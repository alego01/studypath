/**
 * IStoragePort — Puerto de almacenamiento (interfaz)
 * El dominio nunca conoce dónde se guardan los datos.
 */
export class IStoragePort {
  /**
   * Guarda el plan completo del usuario
   * @param {object} plan
   * @returns {Promise<void>}
   */
  async savePlan(plan) {
    throw new Error('savePlan() debe ser implementado');
  }

  /**
   * Carga el plan guardado del usuario
   * @returns {Promise<object|null>}
   */
  async loadPlan() {
    throw new Error('loadPlan() debe ser implementado');
  }

  /**
   * Guarda el progreso (sesiones completadas)
   * @param {object} progress
   * @returns {Promise<void>}
   */
  async saveProgress(progress) {
    throw new Error('saveProgress() debe ser implementado');
  }

  /**
   * Carga el progreso guardado
   * @returns {Promise<object>}
   */
  async loadProgress() {
    throw new Error('loadProgress() debe ser implementado');
  }

  /**
   * Guarda la configuración del usuario (provider, apiKey, etc.)
   * @param {object} config
   * @returns {Promise<void>}
   */
  async saveUserConfig(config) {
    throw new Error('saveUserConfig() debe ser implementado');
  }

  /**
   * Carga la configuración del usuario
   * @returns {Promise<object>}
   */
  async loadUserConfig() {
    throw new Error('loadUserConfig() debe ser implementado');
  }
}
