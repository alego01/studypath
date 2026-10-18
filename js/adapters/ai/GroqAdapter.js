/**
 * GroqAdapter — Adaptador de IA para Groq
 * Implementa IAIPort usando la API de Groq (llama-3.3-70b)
 */
import { IAIPort } from '../../ports/IAIPort.js';
import { parseJSON, repairJSON } from '../utils/jsonUtils.js';

export class GroqAdapter extends IAIPort {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.baseURL = 'https://api.groq.com/openai/v1/chat/completions';
    this.model = 'openai/gpt-oss-20b'; // fallback
  }

  get providerName() { return 'Groq (Llama)'; }

  async _getModel() {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      const data = await res.json();
      const preferred = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
      const available = (data.data || [])
        .map(m => m.id)
        .filter(id => !id.includes('whisper') && !id.includes('prompt-guard') && !id.includes('orpheus') && !id.includes('allam'));
      console.log('[Groq] modelos disponibles:', available);
      return preferred.find(m => available.includes(m)) || available[0] || this.model;
    } catch (e) {
      return this.model;
    }
  }

  async _call(prompt, maxTokens = 4000) {
    if (!this._modelResolved) {
      this.model = await this._getModel();
      this._modelResolved = true;
    }
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
    if (data.error) throw new Error(`Groq error: ${data.error.message}`);
    return data.choices?.[0]?.message?.content || '';
  }

  async generatePlan(prompt) {
    const raw = await this._call(prompt, 8000);
    return parseJSON(raw);
  }

  async validatePlan(plan, profileText) {
    const { buildValidationPrompt } = await import('../../core/plan.js');
    const raw = await this._call(buildValidationPrompt(plan, profileText), 3000);
    return parseJSON(raw);
  }
}
