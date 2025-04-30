FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apk add --no-cache python3 make g++

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Criar diretório para logs
RUN mkdir -p logs

# Expor porta
EXPOSE 3002

# Comando para iniciar a aplicação
CMD ["node", "src/index.js"] 