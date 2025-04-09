const fs = require('fs');
const path = require('path');

class Settings {
    constructor() {
        this.settingsPath = path.join(__dirname, 'settings.json');
        this.settings = this.loadSettings();
    }

    loadSettings() {
        try {
            if (fs.existsSync(this.settingsPath)) {
                const data = fs.readFileSync(this.settingsPath, 'utf8');
                return JSON.parse(data);
            }
            return this.getDefaultSettings();
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            return this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            defaultLineProfile: '1',
            defaultServiceProfile: '1',
            defaultVlan: '100',
            defaultDescription: 'ONU {sn}'
        };
    }

    getAll() {
        return this.settings;
    }

    update(newSettings) {
        this.settings = {
            ...this.settings,
            ...newSettings
        };
        
        try {
            fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            throw new Error('Falha ao salvar configurações');
        }
    }
}

module.exports = new Settings(); 