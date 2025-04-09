#!/bin/bash

# Garantir permissões no início
sudo chown -R ftpuser:ftpuser /app
sudo chmod -R 777 /app
sudo chmod -R 777 /home/ftpuser

# Criar e configurar arquivo de log
sudo touch /var/log/vsftpd.log
sudo chown ftpuser:ftpuser /var/log/vsftpd.log
sudo chmod 777 /var/log/vsftpd.log

# Iniciar o servidor FTP
sudo /usr/sbin/vsftpd /etc/vsftpd.conf &

# Aguardar FTP iniciar
sleep 2

# Mostrar logs do FTP
tail -f /var/log/vsftpd.log &

# Instalar dependências se necessário
npm install

# Iniciar aplicação em modo desenvolvimento
npm run dev 