STATUS"
    echo "HTTPS Status: $HTTPS_STATUS"
    
    if [ "$HTTPS_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Site funcionando com SSL!${NC}"
        elif [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
        echo -e "${GREEN}✅ Redirecionamento HTTP→HTTPS OK!${NC}"
    else
        echo -e "${YELLOW}⚠️  Verificar conectividade${NC}"
    fi
}

# Diagnóstico SSL
ssl_diagnostic() {
    echo -e "${BLUE}🔒 Diagnóstico SSL Completo${NC}"
    echo "============================"
    
    # Status do Traefik
    echo ""
    echo -e "${BLUE}📊 Status Traefik:${NC}"
    if docker service ls | grep -q traefik_traefik; then
        echo -e "${GREEN}✅ Traefik rodando${NC}"
        TRAEFIK_STATUS=$(docker service ls | grep traefik_traefik)
        echo "$TRAEFIK_STATUS"
    else
        echo -e "${RED}❌ Traefik não encontrado${NC}"
        return
    fi
    
    # Verificar certificados
    echo ""
    echo -e "${BLUE}🔒 Certificados:${NC}"
    TRAEFIK_CONTAINER=$(docker ps | grep traefik | awk '{print $1}' | head -1)
    if [ ! -z "$TRAEFIK_CONTAINER" ]; then
        echo "Container Traefik: $TRAEFIK_CONTAINER"
        docker exec $TRAEFIK_CONTAINER ls -la /data/ 2>/dev/null || echo "Erro ao acessar certificados"
        
        # Verificar tamanho do acme.json
        ACME_SIZE=$(docker exec $TRAEFIK_CONTAINER stat -c%s /data/acme.json 2>/dev/null || echo "0")
        echo "Tamanho acme.json: $ACME_SIZE bytes"
        
        if [ "$ACME_SIZE" -gt 100 ]; then
            echo -e "${GREEN}✅ Certificado provavelmente OK${NC}"
        else
            echo -e "${YELLOW}⚠️  Certificado pode não ter sido gerado${NC}"
        fi
    fi
    
    # DNS
    echo ""
    echo -e "${BLUE}🌐 DNS:${NC}"
    DOMAIN_IP=$(dig +short torqueforgedmotorsport.com)
    SERVER_IP=$(curl -s http://ifconfig.me)
    echo "Domínio aponta para: $DOMAIN_IP"
    echo "IP do servidor: $SERVER_IP"
    
    if [ "$DOMAIN_IP" = "$SERVER_IP" ]; then
        echo -e "${GREEN}✅ DNS correto${NC}"
    else
        echo -e "${RED}❌ DNS não aponta para este servidor${NC}"
    fi
    
    # Teste detalhado de SSL
    echo ""
    echo -e "${BLUE}🔍 Teste SSL:${NC}"
    
    # Teste HTTP
    echo -n "HTTP: "
    HTTP_RESULT=$(curl -s -I http://torqueforgedmotorsport.com 2>/dev/null || echo "ERRO")
    if echo "$HTTP_RESULT" | grep -q "301\|302"; then
        echo -e "${GREEN}✅ Redirecionamento OK${NC}"
    else
        echo -e "${RED}❌ Sem redirecionamento${NC}"
    fi
    
    # Teste HTTPS
    echo -n "HTTPS: "
    HTTPS_RESULT=$(curl -s -I https://torqueforgedmotorsport.com 2>/dev/null || echo "ERRO")
    if echo "$HTTPS_RESULT" | grep -q "200"; then
        echo -e "${GREEN}✅ SSL funcionando${NC}"
    else
        echo -e "${RED}❌ SSL com problema${NC}"
    fi
    
    # Logs do Traefik
    echo ""
    echo -e "${BLUE}📋 Logs Traefik (últimas 10 linhas):${NC}"
    docker service logs traefik_traefik --tail=10 2>/dev/null || echo "Erro ao obter logs"
    
    echo ""
    echo -e "${BLUE}💡 Dicas:${NC}"
    echo "- Se certificado não foi gerado, aguarde até 5 minutos"
    echo "- Verifique se DNS aponta para este servidor"
    echo "- Portas 80 e 443 devem estar livres"
    echo "- Dashboard Traefik: http://$(curl -s http://ifconfig.me):8080"
}

# Menu principal
main() {
    # Verificar se está na pasta correta
    if [ ! -f "docker-stack-torque.yml" ]; then
        error "Execute este script na pasta do projeto (onde está o docker-stack-torque.yml)"
    fi
    
    # Verificar se está em swarm mode
    if ! docker info | grep -q "Swarm: active"; then
        error "Docker não está em modo swarm"
    fi
    
    while true; do
        echo ""
        show_options
        read -p "Escolha uma opção [1-5, 0]: " choice
        
        case $choice in
            1)
                rolling_update
                break
            ;;
            2)
                rebuild_complete
                break
            ;;
            3)
                deploy_complete
                break
            ;;
            4)
                show_status
                echo ""
                read -p "Pressione Enter para continuar..."
            ;;
            5)
                ssl_diagnostic
                echo ""
                read -p "Pressione Enter para continuar..."
            ;;
            0)
                info "Operação cancelada"
                exit 0
            ;;
            *)
                error "Opção inválida. Escolha 0-5."
            ;;
        esac
    done
}

# Executar menu principal
main