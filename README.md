# Easy Huawei

Sistema de gerenciamento para equipamentos Huawei.

## Estrutura do Projeto

O projeto está organizado em duas partes principais:

### Backend (`/backend`)
- Node.js + Express
- Gerenciamento de ONUs
- Comunicação com equipamentos Huawei
- Variáveis de ambiente em `.env`

### Frontend (`/frontend`)
- React + Vite
- Material-UI para interface
- Testes com Jest e Testing Library
- Configuração ESLint

## Desenvolvimento

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Testes

### Frontend
```bash
cd frontend
npm test
```

## Estrutura de Diretórios

```
easy-huawei/
├── backend/                 # Backend da aplicação
│   ├── src/                # Código fonte do backend
│   │   └── index.js       # Entry point do backend
│   ├── package.json       # Dependências do backend
│   └── .env              # Variáveis de ambiente do backend
│
├── frontend/               # Frontend da aplicação
│   ├── src/              # Código fonte do frontend
│   │   ├── components/   # Componentes React
│   │   ├── __tests__/   # Testes
│   │   └── api/         # Configuração da API
│   ├── package.json     # Dependências do frontend
│   ├── vite.config.js   # Configuração do Vite
│   ├── jest.config.js   # Configuração do Jest
│   └── .babelrc        # Configuração do Babel
``` 