to (onde está o docker-stack-torque.yml)"
    fi
    
    # Verificar se está em swarm mode
    if ! docker info | grep -q "Swarm: active"; then
        error "Docker não está em modo swarm"
    fi
    
    while true; do
        echo ""
        show_options
        read -p "Escolha uma opção [1-4, 0]: " choice
        
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
            0)
                info "Operação cancelada"
                exit 0
            ;;
            *)
                error "Opção inválida. Escolha 0-4."
            ;;
        esac
    done
}

# Executar menu principal
main