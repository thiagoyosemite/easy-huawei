const { Telnet } = require('telnet-client');
const winston = require('winston');

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
    constructor(config) {
        this.config = config;
        this.connection = new Telnet();
        this.connected = false;

        // Configurações do Telnet
        this.params = {
            host: this.config.host,
            port: this.config.port,
            negotiationMandatory: false,
            timeout: 1500,
            username: this.config.username,
            password: this.config.password,
            shellPrompt: /[\$#>]\s*$/,
            loginPrompt: 'Username:',
            passwordPrompt: 'Password:',
            debug: process.env.NODE_ENV !== 'production'
        };
    }

    async connect() {
        try {
            await this.connection.connect(this.params);
            this.connected = true;
            logger.info('Conexão Telnet estabelecida com sucesso');
            
            // Configurações iniciais
            await this.executeCommand('screen-length 0 temporary');
            await this.executeCommand('config');
        } catch (error) {
            logger.error('Erro na conexão Telnet:', error);
            this.connected = false;
            throw error;
        }
    }

    async executeCommand(command) {
        if (!this.connected) {
            throw new Error('Não conectado à OLT');
        }

        try {
            const response = await this.connection.send(command);
            logger.info(`Comando executado: ${command}`);
            return response;
        } catch (error) {
            logger.error('Erro ao executar comando:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.connected) {
            try {
                await this.connection.end();
                this.connected = false;
                logger.info('Desconectado da OLT');
            } catch (error) {
                logger.error('Erro ao desconectar:', error);
            }
        }
    }

    // Métodos para gerenciamento de ONUs
    async getUnauthorizedONUs() {
        try {
            const result = await this.executeCommand('display ont autofind all');
            return this.parseUnauthorizedONUs(result);
        } catch (error) {
            logger.error('Erro ao buscar ONUs não autorizadas:', error);
            throw error;
        }
    }

    async provisionONU({frame, slot, port, onuId, sn, description, lineProfile, serviceProfile, vlan}) {
        try {
            const commands = [
                `interface gpon ${frame}/${slot}`,
                `ont add ${port} ${onuId} sn-auth ${sn} omci ont-lineprofile-id ${lineProfile} ont-srvprofile-id ${serviceProfile} desc "${description}"`,
                `ont port native-vlan ${port} ${onuId} eth 1 vlan ${vlan}`,
                'quit'
            ];

            for (const command of commands) {
                await this.executeCommand(command);
            }

            logger.info(`ONU ${sn} provisionada com sucesso`);
            return true;
        } catch (error) {
            logger.error(`Erro ao provisionar ONU ${sn}:`, error);
            throw error;
        }
    }

    async deleteONU(frame, slot, port, onuId) {
        try {
            const commands = [
                `interface gpon ${frame}/${slot}`,
                `ont delete ${port} ${onuId}`,
                'quit'
            ];

            for (const command of commands) {
                await this.executeCommand(command);
            }

            logger.info(`ONU ${onuId} removida com sucesso`);
            return true;
        } catch (error) {
            logger.error(`Erro ao remover ONU ${onuId}:`, error);
            throw error;
        }
    }

    async getONUDetails(frame, slot, port, onuId) {
        try {
            const commands = [
                `interface gpon ${frame}/${slot}`,
                `display ont info ${port} ${onuId}`,
                'quit'
            ];

            let details = '';
            for (const command of commands) {
                details += await this.executeCommand(command);
            }

            return details;
        } catch (error) {
            logger.error(`Erro ao obter detalhes da ONU ${onuId}:`, error);
            throw error;
        }
    }

    async getONUSignal(frame, slot, port, onuId) {
        try {
            const command = `display ont optical-info ${frame} ${slot} ${port} ${onuId}`;
            const result = await this.executeCommand(command);
            return result;
        } catch (error) {
            logger.error(`Erro ao obter sinal da ONU ${onuId}:`, error);
            throw error;
        }
    }

    // Método auxiliar para parser de ONUs não autorizadas
    parseUnauthorizedONUs(output) {
        // Implementar o parser de acordo com o formato de saída da OLT
        // Este é um exemplo básico, ajuste conforme necessário
        const lines = output.split('\n');
        const onus = [];
        
        for (const line of lines) {
            // Adaptar regex conforme o formato real da saída
            const match = line.match(/(\d+)\/(\d+)\/(\d+)\s+(\S+)\s+/);
            if (match) {
                onus.push({
                    frame: match[1],
                    slot: match[2],
                    port: match[3],
                    sn: match[4]
                });
            }
        }

        return onus;
    }

    // Métodos específicos para comandos da OLT Huawei
    async getONUList() {
        try {
            const result = await this.executeCommand('display ont info 0 all');
            return result;
        } catch (error) {
            logger.error('Erro ao obter lista de ONUs:', error);
            throw error;
        }
    }

    async getONUStatus(frame, slot, port, onuId) {
        try {
            const command = `display ont info ${frame} ${slot} ${port} ${onuId}`;
            const result = await this.executeCommand(command);
            return result;
        } catch (error) {
            logger.error('Erro ao obter status da ONU:', error);
            throw error;
        }
    }
}

module.exports = OltManager; 