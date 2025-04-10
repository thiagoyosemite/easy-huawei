#!/bin/sh

# Criar diretórios necessários
mkdir -p /var/run/vsftpd/empty
mkdir -p /app/uploads
mkdir -p /etc/vsftpd

# Configurar permissões
chown -R ftpuser:ftpuser /app/uploads
chmod -R 755 /app/uploads
chmod -R 755 /var/run/vsftpd
chmod 755 /etc/vsftpd/vsftpd.conf

# Garantir que o usuário ftpuser tenha uma home válida
mkdir -p /home/ftpuser
chown ftpuser:ftpuser /home/ftpuser
chmod 755 /home/ftpuser

# Iniciar o vsftpd em modo debug para ver logs
vsftpd /etc/vsftpd/vsftpd.conf -opasv_address=0.0.0.0 &

# Aguardar o serviço FTP iniciar
sleep 2

# Verificar se o FTP está rodando
ps aux | grep vsftpd
netstat -tulpn | grep :21

# Iniciar o servidor backend
cd /app && npm run dev 