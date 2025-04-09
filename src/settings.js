const fs = require('fs').promises;
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');

// Configurações padrão
const DEFAULT_SETTINGS = {
    defaultLineProfile: '1',
    defaultServiceProfile: '1',
    defaultVlan: '100',
    defaultDescription: 'ONU {sn}'
};

async function ensureSettingsFile() {
    try {
        await fs.access(SETTINGS_FILE);
    } catch (error) {
        // Se o arquivo não existe, cria o diretório e o arquivo
        await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
        await fs.writeFile(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    }
}

async function getSettings() {
    await ensureSettingsFile();
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
}

async function updateSettings(newSettings) {
    await ensureSettingsFile();
    const settings = { ...DEFAULT_SETTINGS, ...newSettings };
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return settings;
}

module.exports = {
    getSettings,
    updateSettings
}; 