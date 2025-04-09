require('dotenv').config();
const express = require('express');
const path = require('path');
const OltManager = require('./OltManager');
const multer = require('multer');
const fs = require('fs');

const app = express();
app.use(express.json());

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = '/home/ftpuser/ftp';
        // Criar o diretório se não existir
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Configuração da OLT
const oltConfig = {
    host: process.env.OLT_HOST,
    port: parseInt(process.env.OLT_PORT || '23'),
    username: process.env.OLT_USERNAME,
    password: process.env.OLT_PASSWORD
};

const oltManager = new OltManager(oltConfig);

// API Routes
app.use('/api', async (req, res, next) => {
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
app.get('/api/unauthorized-onus', async (req, res) => {
    try {
        const onus = await oltManager.getUnauthorizedONUs();
        res.json({ data: onus });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para provisionar uma nova ONU
app.post('/api/provision-onu', async (req, res) => {
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
app.delete('/api/onu/:frame/:slot/:port/:onuId', async (req, res) => {
    try {
        const { frame, slot, port, onuId } = req.params;
        await oltManager.deleteONU(frame, slot, port, onuId);
        res.json({ message: 'ONU removida com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para obter detalhes de uma ONU
app.get('/api/onu/:frame/:slot/:port/:onuId', async (req, res) => {
    try {
        const { frame, slot, port, onuId } = req.params;
        const details = await oltManager.getONUDetails(frame, slot, port, onuId);
        res.json({ data: details });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para obter sinal de uma ONU
app.get('/api/onu/:frame/:slot/:port/:onuId/signal', async (req, res) => {
    try {
        const { frame, slot, port, onuId } = req.params;
        const signal = await oltManager.getONUSignal(frame, slot, port, onuId);
        res.json({ data: signal });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para upload de arquivo
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }
        res.json({ 
            message: 'Arquivo enviado com sucesso',
            filename: req.file.originalname
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para listar arquivos
app.get('/api/files', (req, res) => {
    const directory = '/home/ftpuser/ftp';
    fs.readdir(directory, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao listar arquivos' });
        }
        res.json({ files });
    });
});

// Rota para download de arquivo
app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join('/home/ftpuser/ftp', filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    res.download(filePath);
});

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../dist')));

// Rota para todas as outras requisições - serve o index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Tratamento de erros
process.on('SIGINT', () => {
    oltManager.disconnect();
    process.exit();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 