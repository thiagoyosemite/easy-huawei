FROM node:20-slim

# Instalar dependências
RUN apt-get update && apt-get install -y \
    vsftpd \
    libsnmp-dev \
    sudo \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar arquivos do projeto
COPY package*.json ./
RUN npm install

COPY . .

# Configurar vsftpd com permissões totais
RUN mkdir -p /var/run/vsftpd/empty && \
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
    echo "chroot_local_user=NO" >> /etc/vsftpd.conf && \
    echo "secure_chroot_dir=/var/run/vsftpd/empty" >> /etc/vsftpd.conf && \
    echo "pam_service_name=vsftpd" >> /etc/vsftpd.conf && \
    echo "pasv_enable=YES" >> /etc/vsftpd.conf && \
    echo "pasv_min_port=21100" >> /etc/vsftpd.conf && \
    echo "pasv_max_port=21110" >> /etc/vsftpd.conf && \
    echo "pasv_address=0.0.0.0" >> /etc/vsftpd.conf && \
    echo "pasv_addr_resolve=NO" >> /etc/vsftpd.conf && \
    echo "seccomp_sandbox=NO" >> /etc/vsftpd.conf && \
    echo "allow_writeable_chroot=YES" >> /etc/vsftpd.conf && \
    echo "local_root=/app" >> /etc/vsftpd.conf && \
    echo "file_open_mode=0777" >> /etc/vsftpd.conf && \
    echo "local_umask=000" >> /etc/vsftpd.conf

# Configurar usuário FTP com privilégios máximos
RUN useradd -m -G sudo ftpuser && \
    echo "ftpuser:ftppassword" | chpasswd && \
    echo "ftpuser ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers && \
    chown -R ftpuser:ftpuser /app && \
    chmod -R 777 /app && \
    chmod -R 777 /home/ftpuser

# Script de inicialização
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3000 21 21100-21110

CMD ["/start.sh"] 