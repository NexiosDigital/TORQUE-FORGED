#!/bin/bash
# traefik-debug.sh - Diagnóstico completo do Traefik

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Diagnóstico do Traefik para Torque Forged${NC}"
echo "=============================================="

# 1. Verificar se Traefik está rodando
echo ""
echo -e "${BLUE}📦 Status do Traefik:${NC}"
if docker ps | grep traefik; then
    echo -e "${GREEN}✅ Traefik está rodando${NC}"
else
    echo -e "${RED}❌ Traefik não encontrado${NC}"
    echo "Containers rodando:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
fi

# 2. Verificar rede traefik
echo ""
echo -e "${BLUE}🌐 Rede Traefik:${NC}"
echo "Containers na rede traefik:"
docker network inspect traefik --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null || echo "Erro ao inspecionar rede"

# 3. Logs do Traefik (últimas 20 linhas)
echo ""
echo -e "${BLUE}📋 Logs do Traefik:${NC}"
if docker ps | grep -q traefik; then
    TRAEFIK_CONTAINER=$(docker ps | grep traefik | awk '{print $1}')
    echo "Container Traefik: $TRAEFIK_CONTAINER"
    docker logs --tail=20 $TRAEFIK_CONTAINER
else
    echo "Traefik não está rodando"
fi

# 4. Verificar labels do container torque-forged
echo ""
echo -e "${BLUE}🏷️  Labels do Container Torque Forged:${NC}"
docker inspect torque-forged-web --format '{{range $k, $v := .Config.Labels}}{{$k}}={{$v}}{{"\n"}}{{end}}' | grep traefik

# 5. Testar conectividade direta
echo ""
echo -e "${BLUE}🔌 Teste de Conectividade Direta:${NC}"
CONTAINER_IP=$(docker inspect torque-forged-web --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
echo "IP do container: $CONTAINER_IP"

if [ ! -z "$CONTAINER_IP" ]; then
    if curl -s -o /dev/null -w "%{http_code}" http://$CONTAINER_IP:80/health | grep -q 200; then
        echo -e "${GREEN}✅ Container responde diretamente${NC}"
    else
        echo -e "${RED}❌ Container não responde diretamente${NC}"
    fi
else
    echo -e "${RED}❌ Não foi possível obter IP do container${NC}"
fi

# 6. Verificar portas do host
echo ""
echo -e "${BLUE}🔌 Portas do Host:${NC}"
netstat -tlnp | grep -E ":(80|443|8080)" || echo "Nenhuma porta padrão encontrada"

# 7. Verificar se há outros proxies
echo ""
echo -e "${BLUE}🔍 Outros Proxies/Web Servers:${NC}"
docker ps | grep -E "(nginx|apache|caddy|haproxy)" | grep -v torque-forged || echo "Nenhum outro proxy encontrado"

# 8. Testar DNS
echo ""
echo -e "${BLUE}🌐 Teste de DNS:${NC}"
nslookup torqueforgedmotorsport.com || echo "Erro no DNS"

# 9. Sugestões de correção
echo ""
echo -e "${BLUE}💡 Possíveis Soluções:${NC}"
echo "1. Verificar se Traefik está configurado corretamente"
echo "2. Verificar entrypoints (web/websecure)"
echo "3. Verificar certificados SSL"
echo "4. Verificar configuração de domínio"
echo ""
echo -e "${YELLOW}📝 Comandos úteis:${NC}"
echo "Ver configuração do Traefik: docker-compose -f /path/to/traefik/docker-compose.yml config"
echo "Restart do Traefik: docker-compose -f /path/to/traefik/docker-compose.yml restart"
echo "Logs completos: docker logs traefik-container-name"