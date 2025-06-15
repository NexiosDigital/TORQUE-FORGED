#!/bin/bash
# deploy-swarm.sh - Deploy para Docker Swarm (igual nexiosdigital)

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

log "🚀 Deploy Torque Forged - Docker Swarm Mode"

# 1. Verificar se está em swarm mode
if ! docker info | grep -q "Swarm: active"; then
    error "Docker não está em modo swarm"
fi

# 2. Parar serviços docker-compose se existirem
log "🛑 Parando serviços docker-compose..."
docker-compose down 2>/dev/null || true

# 3. Remover containers docker-compose órfãos
log "🧹 Removendo containers órfãos..."
docker rm -f torque-forged-web 2>/dev/null || true

# 4. Build da imagem
log "🔨 Fazendo build da imagem..."
docker build -t torque-forged:latest .
success "Imagem construída: torque-forged:latest"

# 5. Verificar se stack já existe
STACK_EXISTS=$(docker stack ls | grep torque-forged || true)
if [ ! -z "$STACK_EXISTS" ]; then
    log "📦 Stack torque-forged já existe. Removendo..."
    docker stack rm torque-forged
    log "⏳ Aguardando stack ser removida completamente..."
    sleep 15
fi

# 6. Deploy do stack
log "🚀 Fazendo deploy do stack..."
docker stack deploy -c docker-stack-torque.yml torque-forged
success "Stack deployada com sucesso!"

# 7. Aguardar serviços ficarem ativos
log "⏳ Aguardando serviços ficarem ativos..."
for i in {1..30}; do
    RUNNING=$(docker service ls | grep torque-forged | grep "1/1" | wc -l)
    if [ "$RUNNING" -ge 1 ]; then
        success "Serviços estão ativos!"
        break
        elif [ $i -eq 30 ]; then
        warning "Timeout: Serviços demoraram para ficar ativos"
    else
        echo -n "."
        sleep 2
    fi
done

# 8. Mostrar status
echo ""
log "📊 Status dos serviços:"
docker service ls | grep torque-forged

# 9. Verificar logs
echo ""
log "📋 Logs dos serviços:"
docker service logs torque-forged_torque-forged --tail=10 2>/dev/null || echo "Logs ainda não disponíveis"

# 10. Verificar rede
echo ""
log "🌐 Verificando rede:"
CONTAINER_ID=$(docker ps | grep torque-forged | awk '{print $1}' | head -1)
if [ ! -z "$CONTAINER_ID" ]; then
    echo "Container ID: $CONTAINER_ID"
    NEXIOS_IP=$(docker inspect $CONTAINER_ID | grep -A 5 NexiosNet | grep IPAddress | cut -d'"' -f4 | head -1)
    if [ ! -z "$NEXIOS_IP" ]; then
        success "IP na NexiosNet: $NEXIOS_IP"
    else
        warning "Container não tem IP na NexiosNet"
    fi
else
    warning "Container não encontrado"
fi

# 11. Teste final
echo ""
log "🌐 Testando conectividade:"
sleep 5
if curl -k -s -o /dev/null -w "%{http_code}" https://torqueforgedmotorsport.com | grep -q "200"; then
    success "Site respondendo com sucesso!"
    elif curl -s -o /dev/null -w "%{http_code}" http://torqueforgedmotorsport.com | grep -q "30"; then
    success "Redirecionamento funcionando! (teste HTTPS manualmente)"
else
    warning "Site ainda não está respondendo. Aguarde alguns minutos."
fi

echo ""
echo -e "${GREEN}🎉 Deploy concluído!${NC}"
echo -e "${BLUE}🔗 Acesse: https://torqueforgedmotorsport.com${NC}"
echo ""
echo -e "${YELLOW}📝 Comandos úteis para Swarm:${NC}"
echo "  Ver serviços:     docker service ls"
echo "  Ver logs:         docker service logs torque-forged_torque-forged"
echo "  Escalar:          docker service scale torque-forged_torque-forged=2"
echo "  Atualizar:        docker service update torque-forged_torque-forged"
echo "  Remover stack:    docker stack rm torque-forged"