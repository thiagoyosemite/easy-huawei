FROM debian:bookworm-slim

# Instalar dependências
RUN apt-get update && apt-get install -y \
    curl \
    git \
    gnupg2 \
    ca-certificates \
    vsftpd \
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
RUN npm install
RUN npm install -g nodemon

# Copiar o resto dos arquivos
COPY . .

# Construir o frontend
RUN npm run build

# Criar diretório para logs
RUN mkdir -p /app/logs \
    && chown -R 1001:0 /app/logs

# Expor porta
EXPOSE 3000

# Configurar usuário não-root
RUN useradd -r -u 1001 -g root nodeuser \
    && chown -R nodeuser:root /app

USER nodeuser

# Comando para iniciar (usando nodemon em desenvolvimento)
CMD ["nodemon", "src/index.js"]

# No servidor (172.16.255.63)
# Instalar o vsftpd
apt-get update
apt-get install vsftpd

# Fazer backup da configuração original
cp /etc/vsftpd.conf /etc/vsftpd.conf.backup

# Configurar o vsftpd
cat > /etc/vsftpd.conf << EOF
listen=YES
listen_ipv6=NO
anonymous_enable=NO
local_enable=YES
write_enable=YES
local_umask=022
dirmessage_enable=YES
use_localtime=YES
xferlog_enable=YES
connect_from_port_20=YES
chroot_local_user=YES
secure_chroot_dir=/var/run/vsftpd/empty
pam_service_name=vsftpd
pasv_enable=YES
pasv_min_port=40000
pasv_max_port=40100
allow_writeable_chroot=YES
user_sub_token=$USER
local_root=/opt/olt-manager/easy-huawei
EOF

# Criar usuário para FTP
adduser ftpuser
# (defina uma senha quando solicitado)

# Dar permissões ao usuário
chown -R ftpuser:ftpuser /opt/olt-manager/easy-huawei

# Reiniciar o serviço FTP
systemctl restart vsftpd 