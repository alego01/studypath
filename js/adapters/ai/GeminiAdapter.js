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
    this.model = 'gemini-1.5-flash';
    this.baseURL = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
  }

  get providerName() { return 'Google Gemini 1.5 Flash'; }

  async _call(prompt, maxTokens = 4000) {
    const res = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
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
