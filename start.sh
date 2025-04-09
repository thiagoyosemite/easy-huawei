#!/bin/bash

# Iniciar o servidor FTP em background
/usr/sbin/vsftpd /etc/vsftpd.conf &

# Mudar para o usuário nodeuser e iniciar a aplicação Node.js
su nodeuser -c "cd /app && npm start" 