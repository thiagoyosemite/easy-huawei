#!/bin/bash

echo "Iniciando build do projeto..."

# Instalando dependências do backend
echo "Instalando dependências do backend..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Erro ao instalar dependências do backend"
    exit 1
fi

# Instalando dependências do frontend
echo "Instalando dependências do frontend..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "Erro ao instalar dependências do frontend"
    exit 1
fi

# Build do frontend
echo "Gerando build do frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "Erro ao gerar build do frontend"
    exit 1
fi

echo "Build concluído com sucesso!"
echo "Para iniciar em produção:"
echo "1. Configure o arquivo .env no diretório backend"
echo "2. Execute 'cd backend && npm run start' para iniciar o backend"
echo "3. Execute 'cd frontend && npm run start' para servir o frontend" 