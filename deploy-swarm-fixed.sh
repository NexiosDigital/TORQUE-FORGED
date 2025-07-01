#!/bin/bash
# deploy-swarm-fixed.sh - Deploy corrigido para Docker Swarm

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

log "🚀 Deploy Torque Forged - Docker Swarm Mode (Versão Corrigida)"

# 1. Verificar se está em swarm mode
if ! docker info | grep -q "Swarm: active"; then
    error "Docker não está em modo swarm"
fi

# 2. Verificar se a rede NexiosNet existe
if ! docker network ls | grep -q "NexiosNet"; then
    error "Rede NexiosNet não encontrada. Crie com: docker network create --driver overlay NexiosNet"
fi

# 3. Verificar se Traefik está rodando
if ! docker service ls | grep -q "traefik"; then
    warning "Traefik não está rodando. Certifique-se de que está ativo."
fi

# 4. Parar serviços docker-compose se existirem
log "🛑 Parando serviços docker-compose..."
docker-compose down 2>/dev/null || true

# 5. Remover containers docker-compose órfãos
log "🧹 Removendo containers órfãos..."
docker rm -f torque-forged-web 2>/dev/null || true

# 6. Build da imagem
log "🔨 Fazendo build da imagem..."
docker build -t torque-forged:latest .
success "Imagem construída: torque-forged:latest"

# 7. Testar a imagem localmente primeiro
log "🧪 Testando imagem localmente..."
TEMP_CONTAINER=$(docker run -d --rm -p 8888:80 torque-forged:latest)
sleep 5
if curl -f -s http://localhost:8888/health > /dev/null; then
    success "Imagem funciona localmente"
    docker stop $TEMP_CONTAINER
else
    docker stop $TEMP_CONTAINER
    error "Imagem não funciona localmente"
fi

# 8. Verificar se stack já existe
STACK_EXISTS=$(docker stack ls | grep torque-forged || true)
if [ ! -z "$STACK_EXISTS" ]; then
    log "📦 Stack torque-forged já existe. Removendo..."
    docker stack rm torque-forged
    log "⏳ Aguardando stack ser removida completamente..."
    sleep 20
fi

# 9. Deploy do stack com arquivo corrigido
log "🚀 Fazendo deploy do stack..."
docker stack deploy -c docker-stack-torque.yml torque-forged
success "Stack deployada com sucesso!"

# 10. Aguardar serviços ficarem ativos
log "⏳ Aguardando serviços ficarem ativos..."
for i in {1..60}; do
    RUNNING=$(docker service ls | grep torque-forged | grep "1/1" | wc -l)
    if [ "$RUNNING" -ge 1 ]; then
        success "Serviços estão ativos!"
        break
        elif [ $i -eq 60 ]; then
        warning "Timeout: Serviços demoraram para ficar ativos"
    else
        echo -n "."
        sleep 2
    fi
done

# 11. Verificar health check
echo ""
log "🏥 Verificando health check..."
sleep 10
CONTAINER_ID=$(docker ps | grep torque-forged | awk '{print $1}' | head -1)
if [ ! -z "$CONTAINER_ID" ]; then
    HEALTH_STATUS=$(docker inspect $CONTAINER_ID | grep '"Health"' -A 10 | grep '"Status"' | cut -d'"' -f4)
    echo "Status de saúde: $HEALTH_STATUS"
    
    # Testar endpoint de health
    if docker exec $CONTAINER_ID curl -f -s http://localhost/health > /dev/null; then
        success "Health check interno OK"
    else
        warning "Health check interno falhou"
    fi
else
    warning "Container não encontrado"
fi

# 12. Mostrar status detalhado
echo ""
log "📊 Status dos serviços:"
docker service ls | grep torque-forged
echo ""
docker service ps torque-forged_torque-forged --no-trunc

# 13. Verificar logs
echo ""
log "📋 Logs recentes:"
docker service logs torque-forged_torque-forged --tail=15

# 14. Verificar conectividade de rede
echo ""
log "🌐 Verificando rede:"
if [ ! -z "$CONTAINER_ID" ]; then
    echo "Container ID: $CONTAINER_ID"
    NEXIOS_IP=$(docker inspect $CONTAINER_ID | grep -A 5 NexiosNet | grep IPAddress | cut -d'"' -f4 | head -1)
    if [ ! -z "$NEXIOS_IP" ]; then
        success "IP na NexiosNet: $NEXIOS_IP"
        
        # Testar conectividade interna
        if docker exec $CONTAINER_ID wget -q --spider http://localhost/; then
            success "Conectividade interna OK"
        else
            warning "Problema na conectividade interna"
        fi
    else
        error "Container não tem IP na NexiosNet"
    fi
else
    warning "Container não encontrado para verificação de rede"
fi

# 15. Verificar configuração do Traefik
echo ""
log "🔀 Verificando Traefik..."
if docker service ls | grep -q traefik; then
    TRAEFIK_LOGS=$(docker service logs traefik_traefik --tail=5 2>/dev/null | grep -i torque || echo "Nenhum log do Torque Forged encontrado")
    echo "Logs do Traefik relacionados ao Torque Forged:"
    echo "$TRAEFIK_LOGS"
else
    warning "Serviço Traefik não encontrado"
fi

# 16. Teste final de conectividade
echo ""
log "🌐 Testando conectividade externa:"
sleep 10

# Teste HTTP
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://torqueforgedmotorsport.com || echo "000")
echo "Status HTTP: $HTTP_STATUS"

# Teste HTTPS
HTTPS_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://torqueforgedmotorsport.com || echo "000")
echo "Status HTTPS: $HTTPS_STATUS"

if [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
    success "Redirecionamento HTTP funcionando!"
    elif [ "$HTTP_STATUS" = "200" ]; then
    success "Site HTTP funcionando!"
else
    warning "Site HTTP não está respondendo (Status: $HTTP_STATUS)"
fi

if [ "$HTTPS_STATUS" = "200" ]; then
    success "Site HTTPS funcionando!"
else
    warning "Site HTTPS não está respondendo (Status: $HTTPS_STATUS)"
fi

echo ""
echo -e "${GREEN}🎉 Deploy concluído!${NC}"
echo -e "${BLUE}🔗 Teste: https://torqueforgedmotorsport.com${NC}"
echo ""
echo -e "${YELLOW}🔧 Comandos úteis para debug:${NC}"
echo "  Logs em tempo real:    docker service logs -f torque-forged_torque-forged"
echo "  Inspecionar serviço:   docker service inspect torque-forged_torque-forged"
echo "  Logs do Traefik:       docker service logs traefik_traefik --tail=50"
echo "  Restart do serviço:    docker service update --force torque-forged_torque-forged"