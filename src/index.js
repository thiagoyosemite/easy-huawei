require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const OltManager = require('./OltManager');
const multer = require('multer');
const fs = require('fs');
const settings = require('./settings');

const app = express();
const port = process.env.PORT || 3000;

// Habilitar CORS para desenvolvimento
app.use(cors());
app.use(express.json());

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = '/app/uploads';
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
    host: process.env.OLT_HOST || '10.0.0.10',
    port: parseInt(process.env.OLT_PORT || '23'),
    username: process.env.OLT_USERNAME || 'admin',
    password: process.env.OLT_PASSWORD || 'admin'
};

const oltManager = new OltManager(oltConfig);

// API Routes
app.use('/api', async (req, res, next) => {
    if (!oltManager.connected) {
        try {
            await oltManager.connect();
        } catch (error) {
            console.error('Erro ao conectar com a OLT:', error);
            return res.status(500).json({ error: 'Falha ao conectar com a OLT' });
        }
    }
    next();
});

// Rota para obter informações da OLT
app.get('/api/olt/info', async (req, res) => {
    try {
        const info = await oltManager.getOLTInfo();
        res.json(info);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para obter ONUs registradas
app.get('/api/onus', async (req, res) => {
    try {
        const onus = await oltManager.getRegisteredONUs();
        res.json(onus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para obter sinais das ONUs
app.get('/api/onus/signals', async (req, res) => {
    try {
        const signals = await oltManager.getONUSignals();
        res.json(signals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para descobrir ONUs não autorizadas
app.get('/api/unauthorized-onus', async (req, res) => {
    try {
        const onus = await oltManager.discoverUnauthorizedONUs();
        res.json(onus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para obter configurações
app.get('/api/settings', (req, res) => {
    res.json(settings.getAll());
});

// Rota para salvar configurações
app.post('/api/settings', (req, res) => {
    try {
        settings.update(req.body);
        res.json({ message: 'Configurações atualizadas com sucesso' });
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
        console.error('Erro ao provisionar ONU:', error);
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
        console.error('Erro ao remover ONU:', error);
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
        console.error('Erro ao obter detalhes da ONU:', error);
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
        console.error('Erro ao obter sinal da ONU:', error);
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
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // Rota para todas as outras requisições - serve o index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
} else {
  // Em desenvolvimento, não tentamos servir arquivos estáticos
  // O Vite já está servindo o frontend em outra porta
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.json({ message: 'Em desenvolvimento, acesse o frontend via Vite: http://localhost:5173' });
  });
}

// Tratamento de erros
process.on('SIGINT', () => {
    oltManager.disconnect();
    process.exit();
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
}); 