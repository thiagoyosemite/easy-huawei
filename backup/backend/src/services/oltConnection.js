const net = require('net');
const { Client } = require('ssh2');
const logger = require('../logger');

class OLTConnection {
    constructor() {
        this.config = {
            host: process.env.OLT_HOST || 'localhost',
            port: process.env.OLT_PORT || 23,
            username: process.env.OLT_USERNAME || 'admin',
            password: process.env.OLT_PASSWORD || 'admin',
            useSSH: process.env.OLT_USE_SSH === 'true' || false
        };
        this.connection = null;
        this.connected = false;
    }

    async connect() {
        if (this.connected) {
            return true;
        }

        return new Promise((resolve, reject) => {
            try {
                if (this.config.useSSH) {
                    this._connectSSH(resolve, reject);
                } else {
                    this._connectTelnet(resolve, reject);
                }
            } catch (error) {
                logger.error('Erro ao conectar com a OLT:', error);
                reject(error);
            }
        });
    }

    async disconnect() {
        if (!this.connected) {
            return;
        }

        return new Promise((resolve) => {
            if (this.config.useSSH && this.connection) {
                this.connection.end();
            } else if (this.connection) {
                this.connection.destroy();
            }
            this.connected = false;
            this.connection = null;
            resolve();
        });
    }

    async executeCommand(command) {
        if (!this.connected) {
            await this.connect();
        }

        return new Promise((resolve, reject) => {
            try {
                if (this.config.useSSH) {
                    this._executeSSHCommand(command, resolve, reject);
                } else {
                    this._executeTelnetCommand(command, resolve, reject);
                }
            } catch (error) {
                logger.error('Erro ao executar comando:', error);
                reject(error);
            }
        });
    }

    _connectSSH(resolve, reject) {
        const conn = new Client();

        conn.on('ready', () => {
            this.connection = conn;
            this.connected = true;
            logger.info('Conexão SSH estabelecida com a OLT');
            resolve(true);
        }).on('error', (err) => {
            logger.error('Erro na conexão SSH:', err);
            reject(err);
        }).connect({
            host: this.config.host,
            port: this.config.port,
            username: this.config.username,
            password: this.config.password
        });
    }

    _connectTelnet(resolve, reject) {
        const client = new net.Socket();

        client.connect(this.config.port, this.config.host, () => {
            this.connection = client;
            this.connected = true;
            logger.info('Conexão Telnet estabelecida com a OLT');
            resolve(true);
        });

        client.on('error', (err) => {
            logger.error('Erro na conexão Telnet:', err);
            reject(err);
        });

        client.on('close', () => {
            this.connected = false;
            this.connection = null;
            logger.info('Conexão Telnet fechada');
        });
    }

    _executeSSHCommand(command, resolve, reject) {
        this.connection.exec(command, (err, stream) => {
            if (err) {
                reject(err);
                return;
            }

            let data = '';
            stream.on('data', (chunk) => {
                data += chunk;
            }).on('end', () => {
                resolve(data);
            }).stderr.on('data', (data) => {
                logger.error('Erro no comando SSH:', data.toString());
            });
        });
    }

    _executeTelnetCommand(command, resolve, reject) {
        try {
            this.connection.write(command + '\n');
            
            let data = '';
            const responseHandler = (chunk) => {
                data += chunk;
                
                // Verifica se a resposta está completa (prompt retornado)
                if (data.includes('MA5800-X7>') || data.includes('MA5800-X7#')) {
                    this.connection.removeListener('data', responseHandler);
                    resolve(data);
                }
            };

            this.connection.on('data', responseHandler);

            // Timeout para evitar espera infinita
            setTimeout(() => {
                this.connection.removeListener('data', responseHandler);
                reject(new Error('Timeout ao executar comando'));
            }, 30000);
        } catch (error) {
            reject(error);
        }
    }
}

module.exports = new OLTConnection(); 