// config.js — Valores de configuración. El Client ID se inyecta en runtime.
const Config = {
  GOOGLE_CLIENT_ID: '%%GOOGLE_CLIENT_ID%%',
  GOOGLE_DRIVE_SCOPE: 'https://www.googleapis.com/auth/drive.appdata',
  GOOGLE_DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  APP_FOLDER: 'StudyPath AI',
  PLAN_FILENAME: 'studypath-plan.json',
  EFSET_URL: 'https://www.efset.org/quick-check/',
};

export default Config;
