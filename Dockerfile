FROM debian:bookworm-slim

# Instalar dependências
RUN apt-get update && apt-get install -y \
    curl \
    git \
    gnupg2 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Instalar Node.js LTS (20.x)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get update \
    && apt-get install -y nodejs \
    && npm install -g npm@latest \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório da aplicação
WORKDIR /app

# Copiar apenas os arquivos de dependência primeiro
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar o resto dos arquivos
COPY . .

# Construir o frontend
RUN npm run build \
    && npm prune --production \
    && rm -rf /root/.npm /root/.node-gyp /tmp/*

# Expor porta
EXPOSE 3000

# Configurar usuário não-root
RUN useradd -r -u 1001 -g root nodeuser
USER nodeuser

# Comando para iniciar
CMD ["npm", "start"] 