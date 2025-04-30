const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

const CONFIG_FILE = path.join(__dirname, '../../.env');

async function getSettings() {
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf8');
        const config = {};
        
        data.split('\n').forEach(line => {
            if (line && !line.startsWith('#')) {
                const [key, value] = line.split('=').map(part => part.trim());
                if (key && value) {
                    config[key] = value;
                }
            }
        });

        return {
            oltHost: config.OLT_HOST || '',
            oltPort: config.OLT_PORT || '23',
            oltUsername: config.OLT_USERNAME || '',
            oltPassword: config.OLT_PASSWORD || '',
            snmpPort: config.SNMP_PORT || '161',
            snmpCommunity: config.SNMP_COMMUNITY || 'public',
            simulationMode: config.SIMULATION_MODE === 'true'
        };
    } catch (error) {
        logger.error('Erro ao ler configurações:', error);
        throw error;
    }
}

async function updateSettings(settings) {
    try {
        const configContent = `# Configurações da OLT
OLT_HOST=${settings.oltHost}
OLT_PORT=${settings.oltPort}
OLT_USERNAME=${settings.oltUsername}
OLT_PASSWORD=${settings.oltPassword}

# Configurações SNMP
SNMP_PORT=${settings.snmpPort}
SNMP_COMMUNITY=${settings.snmpCommunity}

# Configurações do Servidor
PORT=3006
NODE_ENV=${process.env.NODE_ENV || 'development'}
SIMULATION_MODE=${settings.simulationMode}

# Configurações de Segurança
CORS_ORIGIN=http://localhost`;

        await fs.writeFile(CONFIG_FILE, configContent);
        
        // Atualiza as variáveis de ambiente em tempo de execução
        process.env.OLT_HOST = settings.oltHost;
        process.env.OLT_PORT = settings.oltPort;
        process.env.OLT_USERNAME = settings.oltUsername;
        process.env.OLT_PASSWORD = settings.oltPassword;
        process.env.SNMP_PORT = settings.snmpPort;
        process.env.SNMP_COMMUNITY = settings.snmpCommunity;
        process.env.SIMULATION_MODE = settings.simulationMode.toString();

        logger.info('Configurações atualizadas com sucesso');
        return true;
    } catch (error) {
        logger.error('Erro ao atualizar configurações:', error);
        throw error;
    }
}

module.exports = {
    getSettings,
    updateSettings
}; 