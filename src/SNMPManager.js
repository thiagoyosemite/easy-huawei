const snmp = require('net-snmp');
require('dotenv').config();

class SNMPManager {
    constructor() {
        this.session = snmp.createSession(
            process.env.OLT_HOST,
            process.env.SNMP_RO_COMMUNITY,
            {
                port: parseInt(process.env.SNMP_PORT || '2162'),
                version: snmp.Version2c,
                retries: 1,
                timeout: 5000,
                transport: "udp4"
            }
        );
    }

    // OIDs específicos para Huawei MA5800
    static OIDs = {
        // Sistema
        sysDescr: '1.3.6.1.2.1.1.1.0',
        sysUpTime: '1.3.6.1.2.1.1.3.0',
        
        // Temperatura
        temperature: '1.3.6.1.4.1.2011.6.128.1.1.2.23.1.2.1.2',
        
        // ONUs
        onuSignalRx: '1.3.6.1.4.1.2011.6.128.1.1.2.51.1.4',
        onuSignalTx: '1.3.6.1.4.1.2011.6.128.1.1.2.51.1.3',
        onuTemperature: '1.3.6.1.4.1.2011.6.128.1.1.2.51.1.1',
        onuDistance: '1.3.6.1.4.1.2011.6.128.1.1.2.46.1.20',
        onuStatus: '1.3.6.1.4.1.2011.6.128.1.1.2.46.1.15',
        
        // Erros
        onuFecErrors: '1.3.6.1.4.1.2011.6.128.1.1.2.51.1.5',
        onuBipErrors: '1.3.6.1.4.1.2011.6.128.1.1.2.51.1.6'
    };

    get(oid) {
        return new Promise((resolve, reject) => {
            this.session.get([oid], (error, varbinds) => {
                if (error) {
                    reject(error);
                } else {
                    if (snmp.isVarbindError(varbinds[0])) {
                        reject(new Error(snmp.varbindError(varbinds[0])));
                    } else {
                        resolve(varbinds[0].value.toString());
                    }
                }
            });
        });
    }

    getNext(oid) {
        return new Promise((resolve, reject) => {
            this.session.getNext([oid], (error, varbinds) => {
                if (error) {
                    reject(error);
                } else {
                    if (snmp.isVarbindError(varbinds[0])) {
                        reject(new Error(snmp.varbindError(varbinds[0])));
                    } else {
                        resolve({
                            oid: varbinds[0].oid,
                            value: varbinds[0].value.toString()
                        });
                    }
                }
            });
        });
    }

    walk(oid) {
        return new Promise((resolve, reject) => {
            const results = [];
            this.session.walk(oid, (varbind) => {
                if (snmp.isVarbindError(varbind)) {
                    return false;
                }
                results.push({
                    oid: varbind.oid,
                    value: varbind.value.toString()
                });
                return true;
            }, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    }

    set(oid, value, type = snmp.ObjectType.OctetString) {
        return new Promise((resolve, reject) => {
            const varbinds = [{
                oid: oid,
                type: type,
                value: value
            }];

            this.session.set(varbinds, (error, varbinds) => {
                if (error) {
                    reject(error);
                } else {
                    if (snmp.isVarbindError(varbinds[0])) {
                        reject(new Error(snmp.varbindError(varbinds[0])));
                    } else {
                        resolve(true);
                    }
                }
            });
        });
    }

    close() {
        if (this.session) {
            this.session.close();
        }
    }
}

module.exports = SNMPManager; 