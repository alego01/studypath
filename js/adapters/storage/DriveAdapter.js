/**
 * DriveAdapter.js — Adaptador de almacenamiento para Google Drive
 * Implementa IStoragePort usando Google Drive App Data folder
 * Los archivos se guardan en una carpeta privada de la app,
 * invisible para el usuario en su Drive normal.
 */
import { IStoragePort } from '../../ports/IStoragePort.js';

const FILES = {
  plan: 'studypath-plan.json',
  progress: 'studypath-progress.json',
  config: 'studypath-config.json',
};

export class DriveAdapter extends IStoragePort {
  constructor(accessToken) {
    super();
    this.accessToken = accessToken;
    this.baseURL = 'https://www.googleapis.com/drive/v3';
    this.uploadURL = 'https://www.googleapis.com/upload/drive/v3';
    this._fileIdCache = {};
  }

  _headers() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async _findFile(filename) {
    if (this._fileIdCache[filename]) return this._fileIdCache[filename];
    const res = await fetch(
      `${this.baseURL}/files?spaces=appDataFolder&q=name='${filename}'&fields=files(id,name)`,
      { headers: this._headers() }
    );
    const data = await res.json();
    const file = data.files?.[0];
    if (file) this._fileIdCache[filename] = file.id;
    return file?.id || null;
  }

  async _readFile(filename) {
    const fileId = await this._findFile(filename);
    if (!fileId) return null;
    const res = await fetch(`${this.baseURL}/files/${fileId}?alt=media`, { headers: this._headers() });
    if (!res.ok) return null;
    return res.json();
  }

  async _writeFile(filename, data) {
    const content = JSON.stringify(data);
    const fileId = await this._findFile(filename);

    if (fileId) {
      // Actualizar archivo existente
      await fetch(`${this.uploadURL}/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
        body: content
      });
    } else {
      // Crear archivo nuevo en appDataFolder
      const meta = { name: filename, parents: ['appDataFolder'] };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
      form.append('file', new Blob([content], { type: 'application/json' }));
      const res = await fetch(`${this.uploadURL}/files?uploadType=multipart`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        body: form
      });
      const created = await res.json();
      this._fileIdCache[filename] = created.id;
    }
  }

  async savePlan(plan) { await this._writeFile(FILES.plan, plan); }
  async loadPlan() { return this._readFile(FILES.plan); }
  async saveProgress(progress) { await this._writeFile(FILES.progress, progress); }
  async loadProgress() { return (await this._readFile(FILES.progress)) || {}; }
  async saveUserConfig(config) { await this._writeFile(FILES.config, config); }
  async loadUserConfig() { return (await this._readFile(FILES.config)) || {}; }
}
