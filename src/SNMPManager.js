const snmp = require('net-snmp');

class SNMPManager {
    constructor(config) {
        this.host = config.host;
        this.community = config.community || 'public';
        this.version = config.version || 2;
        this.port = config.port || 161;
        this.session = null;
    }

    connect() {
        const options = {
            port: this.port,
            retries: 1,
            timeout: 5000,
            transport: "udp4",
            version: this.version
        };

        this.session = snmp.createSession(this.host, this.community, options);
    }

    async getONUSignalStrength(port, onuId) {
        // OID para potência do sinal RX da ONU
        const rxPowerOid = `1.3.6.1.4.1.2011.6.128.1.1.2.51.1.4.${port}.${onuId}`;
        
        return new Promise((resolve, reject) => {
            if (!this.session) {
                this.connect();
            }

            this.session.get([rxPowerOid], (error, varbinds) => {
                if (error) {
                    reject(error);
                } else {
                    if (snmp.isVarbindError(varbinds[0])) {
                        reject(new Error(snmp.varbindError(varbinds[0])));
                    } else {
                        // Converter o valor para dBm
                        const rxPower = (varbinds[0].value / 100).toFixed(2);
                        resolve(rxPower);
                    }
                }
            });
        });
    }

    async getONUStatus(port, onuId) {
        // OID para status da ONU
        const statusOid = `1.3.6.1.4.1.2011.6.128.1.1.2.46.1.15.${port}.${onuId}`;
        
        return new Promise((resolve, reject) => {
            if (!this.session) {
                this.connect();
            }

            this.session.get([statusOid], (error, varbinds) => {
                if (error) {
                    reject(error);
                } else {
                    if (snmp.isVarbindError(varbinds[0])) {
                        reject(new Error(snmp.varbindError(varbinds[0])));
                    } else {
                        // Mapear valores de status
                        const statusMap = {
                            1: 'online',
                            2: 'offline',
                            3: 'unknown'
                        };
                        resolve(statusMap[varbinds[0].value] || 'unknown');
                    }
                }
            });
        });
    }

    async getBulkONUInfo() {
        // OID base para informações das ONUs
        const baseOid = '1.3.6.1.4.1.2011.6.128.1.1.2.46.1';
        
        return new Promise((resolve, reject) => {
            if (!this.session) {
                this.connect();
            }

            this.session.subtree(baseOid, (error, varbinds) => {
                if (error) {
                    reject(error);
                } else {
                    const onus = [];
                    // Processar os varbinds e organizar as informações
                    // ... implementar processamento dos dados ...
                    resolve(onus);
                }
            });
        });
    }

    close() {
        if (this.session) {
            this.session.close();
            this.session = null;
        }
    }
}

module.exports = SNMPManager; 