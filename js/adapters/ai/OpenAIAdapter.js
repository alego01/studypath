/**
 * OpenAIAdapter — Adaptador de IA para OpenAI
 * Implementa IAIPort usando la API de OpenAI (gpt-4o-mini)
 */
import { IAIPort } from '../../ports/IAIPort.js';
import { parseJSON } from '../utils/jsonUtils.js';

export class OpenAIAdapter extends IAIPort {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.baseURL = 'https://api.openai.com/v1/chat/completions';
    this.model = 'gpt-4o-mini';
  }

  get providerName() { return 'OpenAI GPT-4o Mini'; }

  async _call(prompt, maxTokens = 4000) {
    const res = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(`OpenAI error: ${data.error.message}`);
    return data.choices?.[0]?.message?.content || '';
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
