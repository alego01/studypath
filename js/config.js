// config.js — Lee variables de entorno inyectadas por GitHub Actions
// En desarrollo local, reemplaza los valores manualmente aquí
const Config = {
  GOOGLE_CLIENT_ID: '19805292806-d26pouakhv2gbrpeu3i8s7aqd7o47tb0.apps.googleusercontent.com',  // Inyectado por GitHub Actions
  GOOGLE_DRIVE_SCOPE: 'https://www.googleapis.com/auth/drive.appdata',
  GOOGLE_DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  APP_FOLDER: 'StudyPath AI',
  PLAN_FILENAME: 'studypath-plan.json',
  EFSET_URL: 'https://www.efset.org/quick-check/',
};

export default Config;
