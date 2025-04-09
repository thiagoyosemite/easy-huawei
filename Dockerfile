FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apk add --no-cache python3 make g++ vsftpd

# Copiar arquivos de configuração primeiro
COPY package*.json ./
COPY .env.example .env

# Instalar todas as dependências, incluindo as de desenvolvimento
RUN npm install

# Copiar o resto dos arquivos
COPY . .

# Configurar FTP
RUN adduser -D ftpuser && \
    echo "ftpuser:ftppass" | chpasswd && \
    mkdir -p /app/uploads && \
    chown -R ftpuser:ftpuser /app

COPY vsftpd.conf /etc/vsftpd/vsftpd.conf

# Dar permissões de execução ao script de inicialização
RUN chmod +x start.sh

EXPOSE 3000 5173 20 21 21100-21110

CMD ["/bin/sh", "./start.sh"] 