#!/bin/sh
# healthcheck.sh - Script de verificação de saúde da aplicação

# Verificar se o nginx está rodando
if ! pgrep nginx > /dev/null; then
    echo "ERRO: Nginx não está rodando"
    exit 1
fi

# Verificar se a aplicação responde na porta 80
if ! curl -f -s -o /dev/null http://localhost/health; then
    echo "ERRO: Aplicação não responde na porta 80"
    exit 1
fi

# Verificar se o index.html existe
if [ ! -f /usr/share/nginx/html/index.html ]; then
    echo "ERRO: index.html não encontrado"
    exit 1
fi

# Verificar se os assets críticos existem
if [ ! -d /usr/share/nginx/html/static ]; then
    echo "ERRO: Pasta static não encontrada"
    exit 1
fi

echo "OK: Aplicação saudável"
exit 0