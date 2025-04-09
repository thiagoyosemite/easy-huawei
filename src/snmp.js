const snmp = require('net-snmp');

class SNMPManager {
    constructor() {
        this.session = null;
        this.writeSession = null;
        this.initialize();
    }

    initialize() {
        const options = {
            port: parseInt(process.env.SNMP_PORT || 2162),
            version: parseInt(process.env.SNMP_VERSION || 2),
            retries: 1,
            timeout: 5000,
            transport: "udp4",
            trapPort: 162,
            idBitsSize: 32
        };

        // Sessão somente leitura
        this.session = snmp.createSession(process.env.OLT_HOST, process.env.SNMP_RO_COMMUNITY, options);
        
        // Sessão de escrita (quando necessário)
        this.writeSession = snmp.createSession(process.env.OLT_HOST, process.env.SNMP_RW_COMMUNITY, options);
    }

    async get(oid) {
        return new Promise((resolve, reject) => {
            this.session.get([oid], (error, varbinds) => {
                if (error) {
                    reject(error);
                } else {
                    if (snmp.isVarbindError(varbinds[0])) {
                        reject(new Error(snmp.varbindError(varbinds[0])));
                    } else {
                        resolve(varbinds[0]);
                    }
                }
            });
        });
    }

    async getNext(oid) {
        return new Promise((resolve, reject) => {
            this.session.getNext([oid], (error, varbinds) => {
                if (error) {
                    reject(error);
                } else {
                    if (snmp.isVarbindError(varbinds[0])) {
                        reject(new Error(snmp.varbindError(varbinds[0])));
                    } else {
                        resolve(varbinds[0]);
                    }
                }
            });
        });
    }

    async walk(oid) {
        return new Promise((resolve, reject) => {
            const results = [];
            this.session.walk(oid, (varbind) => {
                if (snmp.isVarbindError(varbind)) {
                    return reject(new Error(snmp.varbindError(varbind)));
                }
                results.push(varbind);
            }, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    }

    async set(oid, value, type) {
        return new Promise((resolve, reject) => {
            const varbinds = [{
                oid: oid,
                type: type,
                value: value
            }];

            this.writeSession.set(varbinds, (error, varbinds) => {
                if (error) {
                    reject(error);
                } else {
                    if (snmp.isVarbindError(varbinds[0])) {
                        reject(new Error(snmp.varbindError(varbinds[0])));
                    } else {
                        resolve(varbinds[0]);
                    }
                }
            });
        });
    }

    // OIDs específicos para Huawei MA5800
    static OIDs = {
        // Informações básicas da ONU
        onuSignalRx: '.1.3.6.1.4.1.2011.6.128.1.1.2.51.1.4',
        onuSignalTx: '.1.3.6.1.4.1.2011.6.128.1.1.2.51.1.5',
        onuTemperature: '.1.3.6.1.4.1.2011.6.128.1.1.2.51.1.6',
        onuDistance: '.1.3.6.1.4.1.2011.6.128.1.1.2.51.1.7',
        onuStatus: '.1.3.6.1.4.1.2011.6.128.1.1.2.51.1.3',
        
        // Contadores de erro
        onuFecErrors: '.1.3.6.1.4.1.2011.6.128.1.1.2.51.1.8',
        onuBipErrors: '.1.3.6.1.4.1.2011.6.128.1.1.2.51.1.9',
        onuHecErrors: '.1.3.6.1.4.1.2011.6.128.1.1.2.51.1.10'
    };

    close() {
        if (this.session) {
            this.session.close();
        }
        if (this.writeSession) {
            this.writeSession.close();
        }
    }
}

module.exports = new SNMPManager(); 