const { NodeSSH } = require('node-ssh');
const logger = require('../logger');

class HuaweiOltConnector {
    constructor() {
        this.ssh = new NodeSSH();
        this.connected = false;
        this.connectionRetries = 0;
        this.maxRetries = 3;
    }

    async connect() {
        if (this.connected) {
            return true;
        }

        try {
            const config = {
                host: process.env.OLT_HOST,
                username: process.env.OLT_USERNAME,
                password: process.env.OLT_PASSWORD,
                port: parseInt(process.env.OLT_PORT || '22', 10),
                readyTimeout: 20000,
                keepaliveInterval: 10000,
            };

            await this.ssh.connect(config);
            this.connected = true;
            this.connectionRetries = 0;
            logger.info('Conectado à OLT com sucesso');

            // Configurar o terminal para não paginar
            await this.executeCommand('terminal length 0');
            await this.executeCommand('terminal width 200');

            return true;
        } catch (error) {
            this.connectionRetries++;
            logger.error('Erro ao conectar à OLT', { error: error.message, retry: this.connectionRetries });
            
            if (this.connectionRetries >= this.maxRetries) {
                throw new Error(`Falha ao conectar à OLT após ${this.maxRetries} tentativas`);
            }
            
            return false;
        }
    }

    async disconnect() {
        if (this.connected) {
            this.ssh.dispose();
            this.connected = false;
            logger.info('Desconectado da OLT');
        }
    }

    async executeCommand(command) {
        try {
            if (!this.connected) {
                await this.connect();
            }

            const result = await this.ssh.execCommand(command);
            
            if (result.code !== 0) {
                throw new Error(`Comando falhou: ${result.stderr}`);
            }

            return result.stdout;
        } catch (error) {
            logger.error('Erro ao executar comando na OLT', { 
                command, 
                error: error.message 
            });
            throw error;
        }
    }

    async getOltInfo() {
        const versionOutput = await this.executeCommand('display version');
        const tempOutput = await this.executeCommand('display temperature');
        return this.parseOltInfo(versionOutput, tempOutput);
    }

    async getOnuList() {
        const output = await this.executeCommand('display ont info 0 all');
        return this.parseOnuList(output);
    }

    async getUnauthorizedOnus() {
        const output = await this.executeCommand('display ont autofind all');
        return this.parseUnauthorizedOnus(output);
    }

    parseOltInfo(versionOutput, tempOutput) {
        const info = {
            model: '',
            version: '',
            uptime: '',
            temperature: ''
        };

        // Parse versão
        const versionLines = versionOutput.split('\n');
        for (const line of versionLines) {
            if (line.includes('VERSION')) {
                info.version = line.split(':')[1]?.trim() || '';
            }
            if (line.includes('PRODUCT')) {
                info.model = line.split(':')[1]?.trim() || '';
            }
            if (line.includes('UPTIME')) {
                info.uptime = line.split(':')[1]?.trim() || '';
            }
        }

        // Parse temperatura
        const tempLines = tempOutput.split('\n');
        for (const line of tempLines) {
            if (line.includes('Current temperature')) {
                info.temperature = line.split(':')[1]?.trim() || '';
            }
        }

        return info;
    }

    parseOnuList(output) {
        const onus = [];
        const lines = output.split('\n');
        let currentFrame = 0;
        let currentSlot = 0;

        for (const line of lines) {
            // Ignorar linhas de cabeçalho e vazias
            if (line.trim() === '' || line.includes('-----') || line.includes('F/S/P')) {
                continue;
            }

            // Atualizar frame/slot atual se a linha indicar
            if (line.includes('Frame')) {
                currentFrame = parseInt(line.match(/Frame\s+(\d+)/)?.[1] || '0', 10);
                continue;
            }
            if (line.includes('Slot')) {
                currentSlot = parseInt(line.match(/Slot\s+(\d+)/)?.[1] || '0', 10);
                continue;
            }

            // Parse da linha de ONU
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 6) {
                const onu = {
                    frame: currentFrame,
                    slot: currentSlot,
                    port: parseInt(parts[0], 10),
                    onuId: parseInt(parts[1], 10),
                    type: parts[2],
                    sn: parts[3],
                    status: parts[4].toLowerCase(),
                    lastSeen: new Date().toISOString(), // Placeholder, implementar parse real
                    signal: parseFloat(parts[5]) || 0,
                    description: parts.slice(6).join(' ')
                };
                onus.push(onu);
            }
        }

        return onus;
    }

    parseUnauthorizedOnus(output) {
        const unauthorizedOnus = [];
        const lines = output.split('\n');

        for (const line of lines) {
            // Ignorar linhas de cabeçalho e vazias
            if (line.trim() === '' || line.includes('-----') || line.includes('F/S/P')) {
                continue;
            }

            // Parse da linha de ONU não autorizada
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 4) {
                const onu = {
                    sn: parts[0],
                    port: parseInt(parts[1], 10),
                    firstSeen: parts[2], // Formato pode precisar ser ajustado
                    status: parts[3].toLowerCase()
                };
                unauthorizedOnus.push(onu);
            }
        }

        return unauthorizedOnus;
    }
}

module.exports = new HuaweiOltConnector(); 