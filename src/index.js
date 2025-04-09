require('dotenv').config();
const express = require('express');
const OltManager = require('./OltManager');

const app = express();
app.use(express.json());

// Configuração da OLT
const oltConfig = {
    host: process.env.OLT_HOST,
    port: parseInt(process.env.OLT_PORT || '2334'),
    username: process.env.OLT_USERNAME,
    password: process.env.OLT_PASSWORD
};

const oltManager = new OltManager(oltConfig);

// Middleware para conectar à OLT
app.use(async (req, res, next) => {
    if (!oltManager.connected) {
        try {
            await oltManager.connect();
        } catch (error) {
            return res.status(500).json({ error: 'Falha ao conectar com a OLT' });
        }
    }
    next();
});

// Rota para listar ONUs não autorizadas
app.get('/unauthorized-onus', async (req, res) => {
    try {
        const onus = await oltManager.getUnauthorizedONUs();
        res.json({ data: onus });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para provisionar uma nova ONU
app.post('/provision-onu', async (req, res) => {
    try {
        const {
            frame,
            slot,
            port,
            onuId,
            sn,
            description,
            lineProfile,
            serviceProfile,
            vlan
        } = req.body;

        // Validação básica
        if (!frame || !slot || !port || !onuId || !sn || !lineProfile || !serviceProfile || !vlan) {
            return res.status(400).json({ error: 'Parâmetros obrigatórios faltando' });
        }

        await oltManager.provisionONU({
            frame,
            slot,
            port,
            onuId,
            sn,
            description: description || sn,
            lineProfile,
            serviceProfile,
            vlan
        });

        res.json({ message: 'ONU provisionada com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para remover uma ONU
app.delete('/onu/:frame/:slot/:port/:onuId', async (req, res) => {
    try {
        const { frame, slot, port, onuId } = req.params;
        await oltManager.deleteONU(frame, slot, port, onuId);
        res.json({ message: 'ONU removida com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para obter detalhes de uma ONU
app.get('/onu/:frame/:slot/:port/:onuId', async (req, res) => {
    try {
        const { frame, slot, port, onuId } = req.params;
        const details = await oltManager.getONUDetails(frame, slot, port, onuId);
        res.json({ data: details });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para obter sinal de uma ONU
app.get('/onu/:frame/:slot/:port/:onuId/signal', async (req, res) => {
    try {
        const { frame, slot, port, onuId } = req.params;
        const signal = await oltManager.getONUSignal(frame, slot, port, onuId);
        res.json({ data: signal });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Tratamento de erros
process.on('SIGINT', () => {
    oltManager.disconnect();
    process.exit();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 