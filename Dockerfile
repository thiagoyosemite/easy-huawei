FROM debian:bookworm-slim

# Instalar dependências
RUN apt-get update && apt-get install -y \
    curl \
    git \
    gnupg2 \
    ca-certificates \
    libsnmp-dev \
    vsftpd \
    && rm -rf /var/lib/apt/lists/*

# Configurar vsftpd
RUN mkdir -p /var/run/vsftpd/empty && \
    mkdir -p /etc/vsftpd && \
    echo "listen=YES" >> /etc/vsftpd.conf && \
    echo "listen_ipv6=NO" >> /etc/vsftpd.conf && \
    echo "anonymous_enable=NO" >> /etc/vsftpd.conf && \
    echo "local_enable=YES" >> /etc/vsftpd.conf && \
    echo "write_enable=YES" >> /etc/vsftpd.conf && \
    echo "local_umask=022" >> /etc/vsftpd.conf && \
    echo "dirmessage_enable=YES" >> /etc/vsftpd.conf && \
    echo "use_localtime=YES" >> /etc/vsftpd.conf && \
    echo "xferlog_enable=YES" >> /etc/vsftpd.conf && \
    echo "connect_from_port_20=YES" >> /etc/vsftpd.conf && \
    echo "chroot_local_user=YES" >> /etc/vsftpd.conf && \
    echo "allow_writeable_chroot=YES" >> /etc/vsftpd.conf && \
    echo "secure_chroot_dir=/var/run/vsftpd/empty" >> /etc/vsftpd.conf && \
    echo "pam_service_name=vsftpd" >> /etc/vsftpd.conf && \
    echo "pasv_enable=YES" >> /etc/vsftpd.conf && \
    echo "pasv_min_port=21100" >> /etc/vsftpd.conf && \
    echo "pasv_max_port=21110" >> /etc/vsftpd.conf

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
RUN npm install
RUN npm install -g nodemon

# Copiar o resto dos arquivos
COPY . .

# Construir o frontend
RUN npm run build

# Criar diretório para logs
RUN mkdir -p /app/logs

# Expor portas
EXPOSE 3000
EXPOSE 21
EXPOSE 21100-21110

# Configurar usuário não-root para a aplicação Node.js
RUN useradd -r -u 1001 -g root nodeuser \
    && chown -R nodeuser:root /app \
    && chown -R nodeuser:root /app/logs

# Criar usuário FTP
RUN useradd -m ftpuser && \
    echo "ftpuser:ftppassword" | chpasswd && \
    mkdir -p /home/ftpuser/ftp && \
    chown -R ftpuser:ftpuser /home/ftpuser/ftp

# Script de inicialização
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"] 