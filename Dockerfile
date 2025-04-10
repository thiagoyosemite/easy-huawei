FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apk add --no-cache python3 make g++ vsftpd net-tools

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
    mkdir -p /var/run/vsftpd/empty && \
    mkdir -p /etc/vsftpd && \
    mkdir -p /home/ftpuser && \
    chown -R ftpuser:ftpuser /app/uploads && \
    chown ftpuser:ftpuser /home/ftpuser && \
    chmod -R 755 /app/uploads && \
    chmod 755 /home/ftpuser && \
    echo "ftpuser" > /etc/vsftpd.userlist && \
    touch /var/log/vsftpd.log && \
    chmod 666 /var/log/vsftpd.log

# Copiar arquivo de configuração do FTP
COPY vsftpd.conf /etc/vsftpd/vsftpd.conf

# Dar permissões de execução ao script de inicialização
RUN chmod +x start.sh

# Expor portas necessárias
EXPOSE 3000 5173 20 21 21100-21110

CMD ["/bin/sh", "./start.sh"] 