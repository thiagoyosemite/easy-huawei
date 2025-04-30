# Easy Huawei OLT Manager

Sistema de gerenciamento para OLTs Huawei.

## Requisitos

- Node.js 18+
- NPM 8+
- SQLite3

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/easy-huawei.git
cd easy-huawei
```

2. Instale as dependências do backend:
```bash
cd backend
npm install
```

3. Instale as dependências do frontend:
```bash
cd ../frontend
npm install
```

## Configuração

1. Configure o arquivo `.env` no diretório `backend` com as informações da sua OLT:
```env
OLT_HOST=seu_ip_da_olt
OLT_PORT=23
OLT_USERNAME=seu_usuario
OLT_PASSWORD=sua_senha
```

## Desenvolvimento

Para rodar em modo de desenvolvimento:

1. Backend:
```bash
cd backend
npm run dev
```

2. Frontend:
```bash
cd frontend
npm run dev
```

## Produção

Para rodar em produção:

1. Build do frontend:
```bash
cd frontend
npm run build
```

2. Iniciar o backend em produção:
```bash
cd backend
npm run start
```

3. Servir o frontend (opcional, pode usar nginx ou outro servidor web):
```bash
cd frontend
npm run start
```

## Portas

- Backend: 3006
- Frontend: 80 (produção) / 5173 (desenvolvimento)

## Modo de Simulação

Para rodar em modo de simulação (sem OLT real):
```bash
SIMULATION_MODE=true npm run start
```

## Logs

Os logs são armazenados em:
- error.log: Erros
- combined.log: Todos os logs

## Suporte

Para suporte, abra uma issue no repositório. 