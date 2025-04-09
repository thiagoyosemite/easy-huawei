const { Telnet } = require('telnet-client');
const winston = require('winston');
const SNMPManager = require('./SNMPManager');
require('dotenv').config();

// Configuração do logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

class OltManager {
    constructor() {
        this.connection = new Telnet();
        this.snmp = new SNMPManager();
        this.host = process.env.OLT_HOST;
        this.username = process.env.OLT_USERNAME;
        this.password = process.env.OLT_PASSWORD;
    }

    async connect() {
        const params = {
            host: this.host,
            port: 23,
            negotiationMandatory: false,
            timeout: 1500,
        };

        try {
            await this.connection.connect(params);
            await this.connection.write(this.username + '\n');
            await this.connection.write(this.password + '\n');
            return true;
        } catch (error) {
            logger.error('Erro na conexão:', error);
            return false;
        }
    }

    async getOLTInfo() {
        try {
            await this.connect();
            
            // Coletar informações do sistema
            await this.connection.write('display version\n');
            const versionInfo = await this.connection.exec('display version\n');
            
            // Coletar informações das placas
            await this.connection.write('display board\n');
            const boardInfo = await this.connection.exec('display board\n');
            
            // Coletar temperatura
            const temperature = await this.snmp.get('1.3.6.1.4.1.2011.6.128.1.1.2.23.1.2.1.2');
            
            return {
                version: this.parseVersionInfo(versionInfo),
                boards: this.parseBoardInfo(boardInfo),
                temperature: parseFloat(temperature) / 10 // Converter para graus Celsius
            };
        } catch (error) {
            logger.error('Erro ao coletar informações da OLT:', error);
            throw error;
        }
    }

    async getRegisteredONUs() {
        try {
            await this.connect();
            const onus = [];
            
            // Coletar ONUs de cada placa
            await this.connection.write('enable\n');
            await this.connection.write('config\n');
            
            // Iterar sobre as placas GPON (slots típicos: 0-15)
            for (let slot = 0; slot <= 15; slot++) {
                await this.connection.write(`interface gpon 0/${slot}\n`);
                const result = await this.connection.exec('display ont info all\n');
                
                const slotONUs = this.parseONUInfo(result, slot);
                onus.push(...slotONUs);
            }
            
            return onus;
        } catch (error) {
            logger.error('Erro ao coletar ONUs:', error);
            throw error;
        }
    }

    async getONUSignals() {
        try {
            const onus = await this.getRegisteredONUs();
            const signals = [];

            for (const onu of onus) {
                const { slot, port, onuId } = onu;
                const index = `${slot}.${port}.${onuId}`;

                const rxPower = await this.snmp.get(`1.3.6.1.4.1.2011.6.128.1.1.2.51.1.4.${index}`);
                const txPower = await this.snmp.get(`1.3.6.1.4.1.2011.6.128.1.1.2.51.1.3.${index}`);

                signals.push({
                    ...onu,
                    rxPower: this.convertDBM(rxPower),
                    txPower: this.convertDBM(txPower)
                });
            }

            return signals;
        } catch (error) {
            logger.error('Erro ao coletar sinais das ONUs:', error);
            throw error;
        }
    }

    async discoverUnauthorizedONUs() {
        try {
            await this.connect();
            await this.connection.write('enable\n');
            await this.connection.write('config\n');
            
            const unauthorizedONUs = [];
            
            for (let slot = 0; slot <= 15; slot++) {
                await this.connection.write(`interface gpon 0/${slot}\n`);
                const result = await this.connection.exec('display ont autofind all\n');
                
                const slotONUs = this.parseUnauthorizedONUs(result, slot);
                unauthorizedONUs.push(...slotONUs);
            }
            
            return unauthorizedONUs;
        } catch (error) {
            logger.error('Erro ao descobrir ONUs não autorizadas:', error);
            throw error;
        }
    }

    async provisionONU({ slot, port, serialNumber, lineProfile, serviceProfile, description, vlan }) {
        try {
            await this.connect();
            await this.connection.write('enable\n');
            await this.connection.write('config\n');
            await this.connection.write(`interface gpon 0/${slot}\n`);
            
            // Encontrar próximo ID disponível
            const result = await this.connection.exec('display ont info all\n');
            const existingONUs = this.parseONUInfo(result, slot);
            const usedIds = existingONUs.map(onu => onu.onuId);
            let nextId = 1;
            while (usedIds.includes(nextId)) {
                nextId++;
            }
            
            // Provisionar ONU
            const commands = [
                `ont add ${port} ${nextId} sn-auth ${serialNumber} omci ont-lineprofile-id ${lineProfile} ont-srvprofile-id ${serviceProfile} desc "${description}"`,
                `ont port native-vlan ${port} ${nextId} eth 1 vlan ${vlan}`,
                'quit'
            ];
            
            for (const command of commands) {
                await this.connection.write(command + '\n');
                await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar processamento
            }
            
            logger.info(`ONU ${serialNumber} provisionada com sucesso`);
            return true;
        } catch (error) {
            logger.error(`Erro ao provisionar ONU ${serialNumber}:`, error);
            throw error;
        }
    }

    // Métodos auxiliares de parsing
    parseVersionInfo(data) {
        const versionMatch = data.match(/VERSION\s*:\s*([\w.-]+)/i);
        const modelMatch = data.match(/PRODUCT\s*:\s*([\w-]+)/i);
        
        return {
            version: versionMatch ? versionMatch[1] : 'Desconhecido',
            model: modelMatch ? modelMatch[1] : 'Desconhecido'
        };
    }

    parseBoardInfo(data) {
        const boards = [];
        const lines = data.split('\n');
        
        for (const line of lines) {
            const match = line.match(/(\d+)\s+(\w+)\s+(\w+)\s+/);
            if (match) {
                boards.push({
                    slot: parseInt(match[1]),
                    type: match[2],
                    status: match[3]
                });
            }
        }
        
        return boards;
    }

    parseONUInfo(data, slot) {
        const onus = [];
        const lines = data.split('\n');
        
        for (const line of lines) {
            const match = line.match(/(\d+)\s+(\d+)\s+(\w+)\s+(\w+)/);
            if (match) {
                onus.push({
                    slot,
                    port: parseInt(match[1]),
                    onuId: parseInt(match[2]),
                    serialNumber: match[3],
                    status: match[4]
                });
            }
        }
        
        return onus;
    }

    parseUnauthorizedONUs(data, slot) {
        const onus = [];
        const lines = data.split('\n');
        
        for (const line of lines) {
            const match = line.match(/(\d+)\s+(\w+)\s+(\w+)/);
            if (match) {
                onus.push({
                    slot,
                    port: parseInt(match[1]),
                    serialNumber: match[2],
                    type: match[3]
                });
            }
        }
        
        return onus;
    }

    convertDBM(value) {
        return (parseInt(value) / 10).toFixed(2);
    }

    async disconnect() {
        try {
            await this.connection.end();
            await this.snmp.close();
        } catch (error) {
            logger.error('Erro ao desconectar:', error);
        }
    }
}

module.exports = OltManager; 