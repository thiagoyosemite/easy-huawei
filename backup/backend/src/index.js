require('dotenv').config();
const express = require('express');
const cors = require('cors');
const winston = require('winston');
const sequelize = require('./config/database');
const Alert = require('./models/Alert');
const oltService = require('./services/olt');
const onuHistory = require('./services/onuHistoryService');
const onuBatchService = require('./services/onuBatchService');
const alertService = require('./services/alertService');
const settingsService = require('./services/settingsService');

// Configuração do logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'easy-huawei-backend' },
    transports: [
        new winston.transports.File({ 
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    ]
});

// Adiciona console em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

const app = express();
const port = process.env.PORT || 3006;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Usando a origem definida no .env
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Habilitando cookies/credenciais se necessário
}));
app.use(express.json());

// Modo de simulação
const simulationMode = process.env.SIMULATION_MODE === 'true';
logger.info(`Iniciando em modo ${simulationMode ? 'simulação' : 'produção'}`);

// Dados simulados para desenvolvimento
const mockData = {
    oltInfo: {
        model: 'Huawei MA5800-X7',
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
    ],
    onuDetails: {
        HWTC1234: {
            serial: 'HWTC1234',
            name: 'Cliente 1',
            model: 'EchoLife HG8245H',
            status: 'online',
            signal: -20,
            port: 1,
            lastSeen: '2024-04-10T15:00:00Z',
            hwVersion: 'V1R1',
            swVersion: '1.0.0',
            uptime: '10 days',
            temperature: '45°C',
            bandwidth: {
                upstream: '50 Mbps',
                downstream: '100 Mbps'
            },
            configuration: {
                lineProfile: 'Default',
                srvProfile: 'Internet',
                nativeVlan: 100
            }
        },
        HWTC5678: {
            serial: 'HWTC5678',
            name: 'Cliente 2',
            model: 'EchoLife HG8245H',
            status: 'offline',
            signal: -25,
            port: 1,
            lastSeen: '2024-04-10T14:30:00Z',
            hwVersion: 'V1R1',
            swVersion: '1.0.0',
            uptime: '0',
            temperature: 'N/A',
            bandwidth: {
                upstream: '0 Mbps',
                downstream: '0 Mbps'
            },
            configuration: {
                lineProfile: 'Default',
                srvProfile: 'Internet',
                nativeVlan: 100
            }
        }
    }
};

// Rotas da API
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', mode: simulationMode ? 'simulation' : 'production' });
});

app.get('/api/olt/info', async (req, res) => {
    try {
        if (simulationMode) {
            return res.json(mockData.oltInfo);
        }
        const info = await oltService.getOltInfo();
        res.json(info);
    } catch (error) {
        logger.error('Erro ao obter informações da OLT', { error: error.message });
        res.status(500).json({ error: 'Erro ao obter informações da OLT' });
    }
});

app.get('/api/onus', async (req, res) => {
    try {
        if (simulationMode) {
            return res.json(mockData.onus);
        }
        const onus = await oltService.getOnuList();
        res.json(onus);
    } catch (error) {
        logger.error('Erro ao obter lista de ONUs', { error: error.message });
        res.status(500).json({ error: 'Erro ao obter lista de ONUs' });
    }
});

app.get('/api/unauthorized-onus', async (req, res) => {
    try {
        if (simulationMode) {
            return res.json(mockData.unauthorizedOnus);
        }
        const unauthorizedOnus = await oltService.getUnauthorizedOnus();
        res.json(unauthorizedOnus);
    } catch (error) {
        logger.error('Erro ao obter ONUs não autorizadas', { error: error.message });
        res.status(500).json({ error: 'Erro ao obter ONUs não autorizadas' });
    }
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

// Endpoint para auto-configuração de ONUs
app.get('/api/onus/:serial/auto-config', (req, res) => {
  const { serial } = req.params;
  
  try {
    // Em modo simulação, registramos uma detecção fictícia
    if (process.env.SIMULATION_MODE) {
      oltService.registerOnuDetection(serial, 7, 8);
    }

    const detectedConfig = oltService.getOnuLastLocation(serial);
    
    if (!detectedConfig) {
      return res.status(404).json({ 
        error: 'Nenhuma configuração automática encontrada para esta ONU' 
      });
    }

    logger.info(`Auto-configuração detectada para ONU ${serial}`, { 
      serial, 
      config: detectedConfig 
    });

    res.json(detectedConfig);
  } catch (error) {
    logger.error(`Erro ao buscar auto-configuração para ONU ${serial}`, { 
      serial, 
      error: error.message 
    });
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para configurar uma porta da OLT
app.post('/api/olt/ports/:board/:port/config', (req, res) => {
  const { board, port } = req.params;
  const config = req.body;

  try {
    oltService.setPortConfig(parseInt(board), parseInt(port), config);
    res.json({ message: 'Configuração atualizada com sucesso' });
  } catch (error) {
    logger.error(`Erro ao configurar porta ${board}/${port}`, {
      board,
      port,
      config,
      error: error.message
    });
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para detalhes da ONU
app.get('/api/onus/:serial/details', (req, res) => {
    const { serial } = req.params;
    
    if (simulationMode) {
        const onuDetails = mockData.onuDetails[serial];
        if (onuDetails) {
            return res.json(onuDetails);
        }
        return res.status(404).json({ error: 'ONU não encontrada' });
    }
    
    res.status(501).json({ error: 'Não implementado' });
});

// Endpoint para histórico de tráfego
app.get('/api/onus/:serial/traffic', (req, res) => {
    if (simulationMode) {
        const trafficData = [
            { time: '08:00', upstream: 10, downstream: 20 },
            { time: '09:00', upstream: 15, downstream: 25 },
            { time: '10:00', upstream: 12, downstream: 22 },
            { time: '11:00', upstream: 18, downstream: 28 },
            { time: '12:00', upstream: 14, downstream: 24 }
        ];
        return res.json(trafficData);
    }
    res.status(501).json({ error: 'Não implementado' });
});

// Endpoint para histórico de sinal
app.get('/api/onus/:serial/signal-history', (req, res) => {
    if (simulationMode) {
        const signalData = [
            { time: '08:00', signal: -20 },
            { time: '09:00', signal: -21 },
            { time: '10:00', signal: -19 },
            { time: '11:00', signal: -20 },
            { time: '12:00', signal: -22 }
        ];
        return res.json(signalData);
    }
    res.status(501).json({ error: 'Não implementado' });
});

// Endpoints para gerenciamento de ONUs
app.post('/api/onus/:serial/start', async (req, res) => {
  try {
    const { serial } = req.params;
    const result = await oltService.startONU(serial);
    res.json(result);
  } catch (error) {
    logger.error(`Erro ao iniciar ONU: ${error.message}`, { error });
    res.status(404).json({ error: error.message });
  }
});

app.post('/api/onus/:serial/stop', async (req, res) => {
  try {
    const { serial } = req.params;
    const result = await oltService.stopONU(serial);
    res.json(result);
  } catch (error) {
    logger.error(`Erro ao parar ONU: ${error.message}`, { error });
    res.status(404).json({ error: error.message });
  }
});

app.post('/api/onus/:serial/reboot', async (req, res) => {
  try {
    const { serial } = req.params;
    const result = await oltService.rebootONU(serial);
    res.json(result);
  } catch (error) {
    logger.error(`Erro ao reiniciar ONU: ${error.message}`, { error });
    res.status(404).json({ error: error.message });
  }
});

app.post('/api/onus/:serial/configure', async (req, res) => {
  try {
    const { serial } = req.params;
    const config = req.body;
    const result = await oltService.configureONU(serial, config);
    res.json(result);
  } catch (error) {
    logger.error(`Erro ao configurar ONU: ${error.message}`, { error });
    if (error.message.includes('inválido')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(404).json({ error: error.message });
    }
  }
});

app.get('/api/onus/:serial/status', async (req, res) => {
  try {
    const { serial } = req.params;
    const status = await oltService.getONUStatus(serial);
    res.json(status);
  } catch (error) {
    logger.error(`Erro ao obter status da ONU: ${error.message}`, { error });
    res.status(404).json({ error: error.message });
  }
});

app.post('/api/onus/:serial/ports/:port/configure', async (req, res) => {
  try {
    const { serial, port } = req.params;
    const config = req.body;
    const result = await oltService.configureONUPort(serial, port, config);
    res.json(result);
  } catch (error) {
    logger.error(`Erro ao configurar porta da ONU: ${error.message}`, { error });
    if (error.message.includes('inválido')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(404).json({ error: error.message });
    }
  }
});

// Endpoints para histórico e métricas
app.get('/api/onus/:serial/history', async (req, res) => {
  try {
    const { serial } = req.params;
    const { eventType, startDate, endDate, limit } = req.query;
    
    const history = onuHistory.getHistory(serial, {
      eventType,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : undefined
    });
    
    res.json(history);
  } catch (error) {
    logger.error(`Erro ao obter histórico da ONU: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/onus/:serial/metrics', async (req, res) => {
  try {
    const { serial } = req.params;
    const metrics = onuHistory.getMetrics(serial);
    res.json(metrics);
  } catch (error) {
    logger.error(`Erro ao obter métricas da ONU: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/metrics', async (req, res) => {
  try {
    const metrics = onuHistory.getAllMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error(`Erro ao obter métricas gerais: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

// Endpoints para operações em lote
app.post('/api/batch-operations', async (req, res) => {
  try {
    const operations = req.body;
    const batchOperation = await onuBatchService.createBatchOperation(operations);
    res.status(201).json(batchOperation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/batch-operations', (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const operations = onuBatchService.listBatchOperations({ status, startDate, endDate });
    res.json(operations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/batch-operations/:batchId', (req, res) => {
  try {
    const { batchId } = req.params;
    const operation = onuBatchService.getBatchOperation(batchId);
    res.json(operation);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.delete('/api/batch-operations/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    await onuBatchService.clearBatchOperation(batchId);
    res.status(204).send();
  } catch (error) {
    if (error.message.includes('não encontrada')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('em progresso')) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.post('/api/onus/:serial/provision', async (req, res) => {
  try {
    const { serial } = req.params;
    const { description, port, vlan, lineProfile, srvProfile, coordinates } = req.body;

    // Validação dos campos obrigatórios
    if (!description || !port || !vlan || !lineProfile) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: description, port, vlan, lineProfile' 
      });
    }

    // Validação do formato da porta
    if (!/^\d+\/\d+\/\d+$/.test(port)) {
      return res.status(400).json({ 
        error: 'Formato de porta inválido. Use o formato: frame/slot/port' 
      });
    }

    // Validação da VLAN
    const vlanNum = parseInt(vlan);
    if (isNaN(vlanNum) || vlanNum < 1 || vlanNum > 4094) {
      return res.status(400).json({ 
        error: 'VLAN deve ser um número entre 1 e 4094' 
      });
    }

    // Provisiona a ONU
    const result = await oltService.authorizeONU(port, serial, description, {
      lineProfile,
      srvProfile: srvProfile || lineProfile,
      nativeVlan: vlanNum
    });

    // Se houver coordenadas, salva no histórico
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      onuHistory.addEvent(serial, {
        type: 'LOCATION_UPDATE',
        coordinates,
        description: 'Localização atualizada durante provisionamento'
      });
    }

    logger.info(`ONU ${serial} provisionada com sucesso`, { 
      serial, 
      port, 
      description,
      lineProfile,
      srvProfile,
      vlan,
      coordinates 
    });

    res.json(result);
  } catch (error) {
    logger.error(`Erro ao provisionar ONU ${req.params.serial}`, { 
      serial: req.params.serial, 
      error: error.message 
    });
    
    if (error.message.includes('inválido')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Rotas de Alertas
app.get('/api/alerts/active', (req, res) => {
    if (simulationMode) {
        // Gerar alertas baseados nos dados simulados
        alertService.generateAlerts(mockData.onus);
        return res.json(alertService.getActiveAlerts());
    }
    res.status(501).json({ error: 'Não implementado' });
});

app.get('/api/alerts/history', (req, res) => {
    if (simulationMode) {
        return res.json(alertService.getAlertHistory(req.query));
    }
    res.status(501).json({ error: 'Não implementado' });
});

app.put('/api/alerts/:id/read', (req, res) => {
    if (simulationMode) {
        const alert = alertService.markAlertAsRead(parseInt(req.params.id));
        if (alert) {
            return res.json(alert);
        }
        return res.status(404).json({ error: 'Alerta não encontrado' });
    }
    res.status(501).json({ error: 'Não implementado' });
});

app.put('/api/alerts/read-all', (req, res) => {
    if (simulationMode) {
        return res.json(alertService.markAllAlertsAsRead());
    }
    res.status(501).json({ error: 'Não implementado' });
});

// Nova rota para resolver alertas
app.put('/api/alerts/:id/resolve', async (req, res) => {
    if (simulationMode) {
        try {
            const alert = await alertService.resolveAlert(parseInt(req.params.id));
            if (alert) {
                return res.json(alert);
            }
            return res.status(404).json({ error: 'Alerta não encontrado' });
        } catch (error) {
            logger.error('Erro ao resolver alerta:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    res.status(501).json({ error: 'Não implementado' });
});

// Rotas de configuração
app.get('/api/settings', async (req, res) => {
    try {
        const settings = await settingsService.getSettings();
        res.json(settings);
    } catch (error) {
        logger.error('Erro ao obter configurações:', error);
        res.status(500).json({ error: 'Erro ao obter configurações' });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        await settingsService.updateSettings(req.body);
        res.json({ message: 'Configurações atualizadas com sucesso' });
    } catch (error) {
        logger.error('Erro ao atualizar configurações:', error);
        res.status(500).json({ error: 'Erro ao atualizar configurações' });
    }
});

// Tratamento de erros
app.use((err, req, res, next) => {
    logger.error('Erro não tratado:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Inicialização do banco de dados
async function initializeDatabase() {
    try {
        await sequelize.authenticate();
        logger.info('Conexão com o banco de dados estabelecida com sucesso.');
        
        // Sincronizar modelos
        await Alert.sync({ force: true });
        logger.info('Modelos sincronizados com sucesso.');
    } catch (error) {
        logger.error('Erro ao inicializar banco de dados:', error);
        process.exit(1);
    }
}

// Inicializar banco de dados antes de iniciar o servidor
initializeDatabase().then(() => {
    app.listen(port, () => {
        logger.info(`Servidor rodando na porta ${port}`);
    });
}); 