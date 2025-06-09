#!/bin/bash
# debug.sh - Script de diagnóstico para Torque Forged

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Diagnóstico do Torque Forged Motorsport${NC}"
echo "================================================"

# 1. Status do container
echo ""
echo -e "${BLUE}📦 Status do Container:${NC}"
docker ps -a | grep torque-forged

# 2. Logs do container
echo ""
echo -e "${BLUE}📋 Últimos Logs:${NC}"
docker logs torque-forged-web --tail=20

# 3. Health check manual
echo ""
echo -e "${BLUE}🏥 Teste do Health Check:${NC}"
if docker exec torque-forged-web /usr/local/bin/healthcheck.sh; then
    echo -e "${GREEN}✅ Health check passou${NC}"
else
    echo -e "${RED}❌ Health check falhou${NC}"
fi

# 4. Verificar se nginx está rodando
echo ""
echo -e "${BLUE}🌐 Status do Nginx:${NC}"
if docker exec torque-forged-web pgrep nginx > /dev/null; then
    echo -e "${GREEN}✅ Nginx está rodando${NC}"
    docker exec torque-forged-web ps aux | grep nginx
else
    echo -e "${RED}❌ Nginx não está rodando${NC}"
fi

# 5. Verificar arquivos
echo ""
echo -e "${BLUE}📁 Verificar Arquivos:${NC}"
echo "Index.html existe:"
docker exec torque-forged-web ls -la /usr/share/nginx/html/index.html 2>/dev/null && echo "✅ SIM" || echo "❌ NÃO"

echo "Pasta static existe:"
docker exec torque-forged-web ls -la /usr/share/nginx/html/static 2>/dev/null && echo "✅ SIM" || echo "❌ NÃO"

# 6. Teste de conectividade
echo ""
echo -e "${BLUE}🌐 Teste de Conectividade:${NC}"
if docker exec torque-forged-web curl -f -s http://localhost/health > /dev/null; then
    echo -e "${GREEN}✅ /health responde${NC}"
else
    echo -e "${RED}❌ /health não responde${NC}"
fi

if docker exec torque-forged-web curl -f -s http://localhost > /dev/null; then
    echo -e "${GREEN}✅ Página principal responde${NC}"
else
    echo -e "${RED}❌ Página principal não responde${NC}"
fi

# 7. Configuração do nginx
echo ""
echo -e "${BLUE}⚙️  Configuração Nginx:${NC}"
echo "Teste de sintaxe:"
if docker exec torque-forged-web nginx -t; then
    echo -e "${GREEN}✅ Configuração OK${NC}"
else
    echo -e "${RED}❌ Erro na configuração${NC}"
fi

# 8. Processos em execução
echo ""
echo -e "${BLUE}🔄 Processos em Execução:${NC}"
docker exec torque-forged-web ps aux

# 9. Portas abertas
echo ""
echo -e "${BLUE}🔌 Portas Abertas:${NC}"
docker exec torque-forged-web netstat -tlnp 2>/dev/null || echo "netstat não disponível"

# 10. Logs do nginx
echo ""
echo -e "${BLUE}📝 Logs do Nginx:${NC}"
echo "Access log:"
docker exec torque-forged-web tail -5 /var/log/nginx/access.log 2>/dev/null || echo "Sem logs de acesso"

echo "Error log:"
docker exec torque-forged-web tail -5 /var/log/nginx/error.log 2>/dev/null || echo "Sem logs de erro"

echo ""
echo -e "${GREEN}🔍 Diagnóstico completo!${NC}"