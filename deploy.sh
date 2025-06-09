#!/bin/bash
# deploy.sh - Script de deploy para Torque Forged Motorsport

set -e  # Exit on any error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
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

# Configurações
PROJECT_NAME="torque-forged"
CONTAINER_NAME="torque-forged-web"
IMAGE_NAME="torque-forged:latest"
BACKUP_DIR="./backups"

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script na raiz do projeto (onde está o package.json)"
fi

# Criar diretório de backup
mkdir -p $BACKUP_DIR

log "🚀 Iniciando deploy do Torque Forged Motorsport..."

# 1. Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    error "Docker não está rodando ou não é acessível"
fi

# 2. Verificar se a rede traefik existe
if ! docker network inspect traefik > /dev/null 2>&1; then
    warning "Rede 'traefik' não encontrada. Criando..."
    docker network create traefik
    success "Rede traefik criada"
fi

# 3. Verificar variáveis de ambiente
if [ ! -f ".env.production" ]; then
    warning "Arquivo .env.production não encontrado"
    echo "Crie o arquivo .env.production com as variáveis necessárias"
    echo "Exemplo:"
    echo "REACT_APP_SUPABASE_URL=https://your-project.supabase.co"
    echo "REACT_APP_SUPABASE_ANON_KEY=your_anon_key"
    read -p "Pressione Enter quando tiver configurado as variáveis..."
fi

# 4. Backup do container atual (se existir)
if docker ps -a | grep -q $CONTAINER_NAME; then
    log "📦 Fazendo backup do container atual..."
    docker export $CONTAINER_NAME > "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar" 2>/dev/null || true
    success "Backup criado em $BACKUP_DIR"
fi

# 5. Parar container atual
if docker ps | grep -q $CONTAINER_NAME; then
    log "🛑 Parando container atual..."
    docker-compose down
    success "Container parado"
fi

# 6. Remover imagem antiga
if docker images | grep -q $PROJECT_NAME; then
    log "🗑️  Removendo imagem antiga..."
    docker rmi $IMAGE_NAME 2>/dev/null || true
    success "Imagem antiga removida"
fi

# 7. Build da nova imagem
log "🔨 Construindo nova imagem..."
docker-compose build --no-cache
success "Imagem construída com sucesso"

# 8. Verificar se os arquivos necessários existem
required_files=("Dockerfile" "nginx.conf" "healthcheck.sh" "docker-compose.yml")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        error "Arquivo obrigatório não encontrado: $file"
    fi
done

# 9. Iniciar container
log "🚀 Iniciando novo container..."
docker-compose up -d
success "Container iniciado"

# 10. Aguardar container ficar saudável
log "🔍 Aguardando container ficar saudável..."
for i in {1..30}; do
    if docker ps | grep -q "$CONTAINER_NAME.*healthy"; then
        success "Container está saudável!"
        break
        elif [ $i -eq 30 ]; then
        error "Timeout: Container não ficou saudável em 60 segundos"
    else
        echo -n "."
        sleep 2
    fi
done

# 11. Verificar logs para erros
log "📋 Verificando logs..."
if docker logs $CONTAINER_NAME 2>&1 | grep -i error; then
    warning "Erros encontrados nos logs. Verifique manualmente:"
    echo "docker logs $CONTAINER_NAME"
else
    success "Nenhum erro crítico encontrado nos logs"
fi

# 12. Teste de conectividade
log "🌐 Testando conectividade..."
if docker exec $CONTAINER_NAME curl -f -s http://localhost/health > /dev/null; then
    success "Health check passou!"
else
    warning "Health check falhou. Verifique manualmente"
fi

# 13. Limpeza de imagens não utilizadas
log "🧹 Limpando imagens não utilizadas..."
docker image prune -f > /dev/null
success "Limpeza concluída"

# 14. Mostrar status final
log "📊 Status do deployment:"
echo ""
echo "Container: $(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep $CONTAINER_NAME)"
echo ""
echo "Acesse: https://torqueforgedmotorsport.com"
echo ""

# 15. Comandos úteis
echo -e "${BLUE}📝 Comandos úteis:${NC}"
echo "  Ver logs:        docker logs -f $CONTAINER_NAME"
echo "  Restart:         docker-compose restart"
echo "  Stop:            docker-compose down"
echo "  Shell:           docker exec -it $CONTAINER_NAME sh"
echo "  Status:          docker ps | grep $CONTAINER_NAME"
echo ""

success "🎉 Deploy concluído com sucesso!"
echo ""
echo -e "${GREEN}🌟 Torque Forged Motorsport está online!${NC}"
echo -e "${BLUE}🔗 https://torqueforgedmotorsport.com${NC}"