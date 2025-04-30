const winston = require('winston');
const { Op } = require('sequelize');
const Alert = require('../models/Alert');
const sequelize = require('../config/database');

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

// Função para gerar alertas baseados no estado das ONUs
async function generateAlerts(onus) {
    try {
        // Verificar ONUs offline
        for (const onu of onus.filter(onu => onu.status === 'offline')) {
            try {
                const existingAlert = await Alert.findOne({
                    where: {
                        type: 'onu_offline',
                        onuId: onu.id,
                        resolved: false
                    }
                });

                if (!existingAlert) {
                    await Alert.create({
                        type: 'onu_offline',
                        severity: 'error',
                        title: 'ONU Offline',
                        message: `ONU ${onu.sn} (${onu.description || 'Sem descrição'}) está offline`,
                        onuId: onu.id
                    });
                }
            } catch (error) {
                logger.error('Erro ao processar alerta de ONU offline:', error);
            }
        }

        // Verificar ONUs com sinal alto
        for (const onu of onus.filter(onu => onu.signal >= -15)) {
            try {
                const existingAlert = await Alert.findOne({
                    where: {
                        type: 'high_signal',
                        onuId: onu.id,
                        resolved: false
                    }
                });

                if (!existingAlert) {
                    await Alert.create({
                        type: 'high_signal',
                        severity: 'warning',
                        title: 'Sinal Alto',
                        message: `ONU ${onu.sn} (${onu.description || 'Sem descrição'}) está com sinal alto: ${onu.signal}dB`,
                        onuId: onu.id
                    });
                }
            } catch (error) {
                logger.error('Erro ao processar alerta de sinal alto:', error);
            }
        }

        return await getActiveAlerts();
    } catch (error) {
        logger.error('Erro ao gerar alertas:', error);
        return [];
    }
}

// Função para marcar alerta como lido
async function markAlertAsRead(alertId) {
    try {
        const alert = await Alert.findByPk(alertId);
        if (alert) {
            alert.read = true;
            await alert.save();
            return alert;
        }
        return null;
    } catch (error) {
        logger.error('Erro ao marcar alerta como lido:', error);
        return null;
    }
}

// Função para marcar todos os alertas como lidos
async function markAllAlertsAsRead() {
    try {
        await Alert.update(
            { read: true },
            { where: { read: false } }
        );
        return await Alert.findAll();
    } catch (error) {
        logger.error('Erro ao marcar todos os alertas como lidos:', error);
        return [];
    }
}

// Função para obter alertas ativos
async function getActiveAlerts() {
    try {
        return await Alert.findAll({
            where: { resolved: false },
            order: [['createdAt', 'DESC']]
        });
    } catch (error) {
        logger.error('Erro ao obter alertas ativos:', error);
        return [];
    }
}

// Função para obter histórico de alertas
async function getAlertHistory(params = {}) {
    try {
        const where = {};
        
        if (params.severity) {
            where.severity = params.severity;
        }
        if (params.type) {
            where.type = params.type;
        }
        if (params.read !== undefined) {
            where.read = params.read;
        }

        return await Alert.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });
    } catch (error) {
        logger.error('Erro ao obter histórico de alertas:', error);
        return [];
    }
}

// Função para resolver um alerta
async function resolveAlert(alertId) {
    try {
        const alert = await Alert.findByPk(alertId);
        if (alert) {
            alert.resolved = true;
            alert.resolvedAt = new Date();
            await alert.save();
            return alert;
        }
        return null;
    } catch (error) {
        logger.error('Erro ao resolver alerta:', error);
        return null;
    }
}

module.exports = {
    generateAlerts,
    markAlertAsRead,
    markAllAlertsAsRead,
    getActiveAlerts,
    getAlertHistory,
    resolveAlert
}; 