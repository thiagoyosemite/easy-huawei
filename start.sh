#!/bin/bash

# Iniciar o servidor FTP
/usr/sbin/vsftpd /etc/vsftpd.conf &

# Iniciar a aplicação Node.js
npm start 