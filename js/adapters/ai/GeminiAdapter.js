/**
 * GeminiAdapter — Adaptador de IA para Google Gemini
 * Implementa IAIPort usando la API de Gemini (gemini-1.5-flash)
 */
import { IAIPort } from '../../ports/IAIPort.js';
import { parseJSON } from '../utils/jsonUtils.js';

export class GeminiAdapter extends IAIPort {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.model = 'gemini-1.5-flash'; // fallback
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  get providerName() { return 'Google Gemini'; }

  async _getModel() {
    try {
      const res = await fetch(`${this.baseURL}?key=${this.apiKey}`);
      const data = await res.json();
      const preferred = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      const available = (data.models || [])
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => m.name.split('/').pop());
      return preferred.find(m => available.includes(m)) || available[0] || this.model;
    } catch {
      return this.model;
    }
  }

  async _call(prompt, maxTokens = 4000) {
    if (!this._modelResolved) {
      this.model = await this._getModel();
      this._modelResolved = true;
    }
    const res = await fetch(`${this.baseURL}/${this.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.3,
        }
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(`Gemini error: ${data.error.message}`);
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async generatePlan(prompt) {
    const raw = await this._call(prompt, 4000);
    return parseJSON(raw);
  }

  async validatePlan(plan, profileText) {
    const { buildValidationPrompt } = await import('../../core/plan.js');
    const raw = await this._call(buildValidationPrompt(plan, profileText), 3000);
    return parseJSON(raw);
  }
}
