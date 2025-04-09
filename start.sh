#!/bin/sh

# Iniciar o vsftpd em background
vsftpd /etc/vsftpd/vsftpd.conf &

# Criar diretório de uploads se não existir
mkdir -p /app/uploads
chown -R ftpuser:ftpuser /app/uploads

# Iniciar o servidor backend
cd /app && npm run dev 