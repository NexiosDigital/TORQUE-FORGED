#!/bin/bash
# setup-swarm-ssl.sh - Setup SSL completo para Docker Swarm

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

echo -e "${BLUE}🚀 Setup SSL para Torque Forged - Docker Swarm${NC}"
echo "================================================="

# Verificar se está executando como root/sudo
if [ "$EUID" -ne 0 ]; then
    error "Execute como sudo ou root"
fi

# Verificar dependências
log "🔍 Verificando dependências..."
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado"
fi

if ! docker info | grep -q "Swarm: active"; then
    warning "Docker não está em modo swarm. Inicializando..."
    docker swarm init
    success "Swarm mode inicializado"
else
    success "Docker Swarm já ativo"
fi

# Criar redes necessárias
log "🌐 Configurando redes Docker..."

# Rede do Traefik
if ! docker network ls | grep -q traefik-public; then
    docker network create \
    --driver=overlay \
    --attachable \
    traefik-public
    success "Rede traefik-public criada"
else
    success "Rede traefik-public já existe"
fi

# Rede NexiosNet (se não existir)
if ! docker network ls | grep -q nexios-net; then
    docker network create \
    --driver=overlay \
    --attachable \
    nexios-net
    success "Rede nexios-net criada"
else
    success "Rede nexios-net já existe"
fi

# Verificar DNS
log "🌍 Verificando DNS..."
DOMAIN_IP=$(dig +short torqueforgedmotorsport.com)
SERVER_IP=$(curl -s http://ifconfig.me)

echo "IP do domínio: $DOMAIN_IP"
echo "IP do servidor: $SERVER_IP"

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    warning "DNS ainda não aponta para este servidor"
    echo "Atualize os registros DNS na HostGator:"
    echo "A record '@' -> $SERVER_IP"
    echo "A record 'www' -> $SERVER_IP"
    echo ""
    read -p "Pressione ENTER após atualizar o DNS..." -r
fi

# Verificar portas
log "🔌 Verificando portas..."
if netstat -tlnp | grep -E ":80 |:443 " | grep -v docker; then
    warning "Portas 80 ou 443 estão ocupadas"
    echo "Serviços encontrados:"
    netstat -tlnp | grep -E ":80 |:443 "
    echo ""
    read -p "Pare outros serviços web e pressione ENTER..." -r
fi

# Parar stacks existentes
log "🛑 Parando stacks existentes..."
docker stack rm traefik 2>/dev/null || true
docker stack rm torque-forged 2>/dev/null || true

# Aguardar remoção
log "⏳ Aguardando remoção completa..."
while docker service ls 2>/dev/null | grep -E "(traefik|torque-forged)"; do
    echo -n "."
    sleep 2
done
echo ""
success "Stacks removidas"

# Deploy Traefik
log "🚀 Fazendo deploy do Traefik..."
if [ ! -f "docker-stack-traefik.yml" ]; then
    error "Arquivo docker-stack-traefik.yml não encontrado!"
fi

docker stack deploy -c docker-stack-traefik.yml traefik
success "Traefik deployado"

# Aguardar Traefik ficar ativo
log "⏳ Aguardando Traefik ficar ativo..."
for i in {1..30}; do
    if docker service ls | grep traefik_traefik | grep -q "1/1"; then
        success "Traefik está ativo!"
        break
        elif [ $i -eq 30 ]; then
        error "Timeout: Traefik demorou para ficar ativo"
    else
        echo -n "."
        sleep 3
    fi
done

# Verificar Traefik
log "🔍 Verificando Traefik..."
sleep 10

if curl -s http://localhost:8080/api/rawdata > /dev/null; then
    success "API do Traefik funcionando"
else
    warning "API do Traefik não responde - continuando..."
fi

# Build da aplicação
log "🔨 Construindo imagem do Torque Forged..."
if [ ! -f "Dockerfile" ]; then
    error "Dockerfile não encontrado!"
fi

docker build -t torque-forged:latest .
success "Imagem construída"

# Deploy da aplicação
log "🚀 Fazendo deploy do Torque Forged..."
if [ ! -f "docker-stack-torque.yml" ]; then
    error "Arquivo docker-stack-torque.yml não encontrado!"
fi

docker stack deploy -c docker-stack-torque.yml torque-forged
success "Torque Forged deployado"

# Aguardar aplicação ficar ativa
log "⏳ Aguardando aplicação ficar ativa..."
for i in {1..30}; do
    if docker service ls | grep torque-forged_torque-forged | grep -q "1/1"; then
        success "Aplicação está ativa!"
        break
        elif [ $i -eq 30 ]; then
        warning "Timeout: Aplicação demorou para ficar ativa"
    else
        echo -n "."
        sleep 3
    fi
done

# Aguardar certificado SSL
log "🔒 Aguardando certificado SSL..."
sleep 30

# Testar conectividade
log "🌐 Testando conectividade..."
for i in {1..10}; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://torqueforgedmotorsport.com 2>/dev/null || echo "000")
    HTTPS_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://torqueforgedmotorsport.com 2>/dev/null || echo "000")
    
    if [ "$HTTPS_STATUS" = "200" ]; then
        success "HTTPS funcionando!"
        break
        elif [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
        success "HTTP redirecionando para HTTPS!"
        break
        elif [ $i -eq 10 ]; then
        warning "Site ainda não está acessível. Aguarde alguns minutos."
    else
        echo "Tentativa $i/10... HTTP: $HTTP_STATUS, HTTPS: $HTTPS_STATUS"
        sleep 15
    fi
done

# Status final
echo ""
echo -e "${BLUE}📊 Status Final:${NC}"
echo "================================"

echo ""
echo -e "${BLUE}🔧 Serviços Docker:${NC}"
docker service ls

echo ""
echo -e "${BLUE}🌐 URLs:${NC}"
echo "Site: https://torqueforgedmotorsport.com"
echo "Traefik Dashboard: http://$SERVER_IP:8080"
echo "Login Dashboard: admin / password"

echo ""
echo -e "${BLUE}📋 Comandos úteis:${NC}"
echo "Ver logs Traefik: docker service logs traefik_traefik"
echo "Ver logs App: docker service logs torque-forged_torque-forged"
echo "Atualizar site: ./update.sh"
echo "Status geral: docker service ls"

echo ""
success "🎉 Setup concluído!"
info "Use seu script update.sh para futuras atualizações"

# Criar script de diagnóstico
cat > /opt/ssl-diagnostic-swarm.sh << 'EOF'
#!/bin/bash
echo "🔍 Diagnóstico SSL - Docker Swarm"
echo "================================="

echo "📊 Serviços:"
docker service ls

echo ""
echo "🌐 DNS:"
echo "Domínio: $(dig +short torqueforgedmotorsport.com)"
echo "Servidor: $(curl -s http://ifconfig.me)"

echo ""
echo "🔒 Conectividade:"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://torqueforgedmotorsport.com 2>/dev/null || echo "000")
HTTPS=$(curl -k -s -o /dev/null -w "%{http_code}" https://torqueforgedmotorsport.com 2>/dev/null || echo "000")
echo "HTTP: $HTTP"
echo "HTTPS: $HTTPS"

echo ""
echo "📋 Logs Traefik:"
docker service logs traefik_traefik --tail=5

echo ""
echo "📋 Logs App:"
docker service logs torque-forged_torque-forged --tail=5
EOF

chmod +x /opt/ssl-diagnostic-swarm.sh
success "Script de diagnóstico criado: /opt/ssl-diagnostic-swarm.sh"