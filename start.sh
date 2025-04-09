#!/bin/bash

# Criar arquivo de log do vsftpd com permissões totais
touch /var/log/vsftpd.log
chmod 777 /var/log/vsftpd.log

# Garantir permissões máximas
chown -R ftpuser:ftpuser /app
chmod -R 777 /app
chmod -R 777 /home/ftpuser

# Iniciar o servidor FTP
/usr/sbin/vsftpd /etc/vsftpd.conf &

# Aguardar um momento para o FTP iniciar
sleep 2

# Mostrar log do FTP
tail -f /var/log/vsftpd.log &

# Iniciar a aplicação Node.js como ftpuser
su ftpuser -c "cd /app && npm start" 