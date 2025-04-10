require('dotenv').config();
const express = require('express');
const cors = require('cors');
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
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Modo de simulação
const simulationMode = process.env.SIMULATION_MODE === 'true';
logger.info(`Iniciando em modo ${simulationMode ? 'simulação' : 'produção'}`);

// Dados simulados para desenvolvimento
const mockData = {
    oltInfo: {
        model: 'Huawei MA5800-X17',
        version: '1.0.0',
        uptime: '10 days',
        temperature: '45°C'
    },
    onus: [
        { 
            id: 1,
            frame: 0, 
            slot: 0, 
            port: 1, 
            onuId: 1, 
            sn: 'HWTC1234', 
            status: 'online', 
            signal: -20,
            description: 'Cliente 1',
            lastSeen: '2024-04-10T15:00:00Z'
        },
        { 
            id: 2,
            frame: 0, 
            slot: 0, 
            port: 1, 
            onuId: 2, 
            sn: 'HWTC5678', 
            status: 'offline', 
            signal: -25,
            description: 'Cliente 2',
            lastSeen: '2024-04-10T14:30:00Z'
        }
    ],
    unauthorizedOnus: [
        {
            sn: 'HWTC9012',
            port: 2,
            firstSeen: '2024-04-10T16:00:00Z'
        }
    ],
    // Dados simulados para os gráficos
    authHistory: [
        { date: '2024-04-04', count: 3 },
        { date: '2024-04-05', count: 5 },
        { date: '2024-04-06', count: 2 },
        { date: '2024-04-07', count: 4 },
        { date: '2024-04-08', count: 6 },
        { date: '2024-04-09', count: 3 },
        { date: '2024-04-10', count: 4 }
    ],
    lossHistory: [
        { time: '08:00', count: 2 },
        { time: '09:00', count: 1 },
        { time: '10:00', count: 3 },
        { time: '11:00', count: 0 },
        { time: '12:00', count: 2 },
        { time: '13:00', count: 1 },
        { time: '14:00', count: 4 }
    ],
    systemMetrics: [
        { time: '08:00', cpu: 45, bandwidth: 850 },
        { time: '09:00', cpu: 52, bandwidth: 920 },
        { time: '10:00', cpu: 48, bandwidth: 880 },
        { time: '11:00', cpu: 55, bandwidth: 950 },
        { time: '12:00', cpu: 50, bandwidth: 900 },
        { time: '13:00', cpu: 47, bandwidth: 870 },
        { time: '14:00', cpu: 53, bandwidth: 930 }
    ]
};

// Rotas da API
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', mode: simulationMode ? 'simulation' : 'production' });
});

app.get('/api/olt/info', (req, res) => {
    if (simulationMode) {
        return res.json(mockData.oltInfo);
    }
    res.status(501).json({ error: 'Não implementado' });
});

app.get('/api/onus', (req, res) => {
    if (simulationMode) {
        return res.json(mockData.onus);
    }
    res.status(501).json({ error: 'Não implementado' });
});

app.get('/api/unauthorized-onus', (req, res) => {
    if (simulationMode) {
        return res.json(mockData.unauthorizedOnus);
    }
    res.status(501).json({ error: 'Não implementado' });
});

app.get('/api/auth-history', (req, res) => {
    if (simulationMode) {
        return res.json(mockData.authHistory);
    }
    res.status(501).json({ error: 'Não implementado' });
});

app.get('/api/loss-history', (req, res) => {
    if (simulationMode) {
        return res.json(mockData.lossHistory);
    }
    res.status(501).json({ error: 'Não implementado' });
});

app.get('/api/system-metrics', (req, res) => {
    if (simulationMode) {
        return res.json(mockData.systemMetrics);
    }
    res.status(501).json({ error: 'Não implementado' });
});

// Tratamento de erros
app.use((err, req, res, next) => {
    logger.error('Erro não tratado:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(port, () => {
    logger.info(`Servidor rodando na porta ${port}`);
}); 