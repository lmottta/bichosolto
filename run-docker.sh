#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se estamos no Windows
IS_WINDOWS=false
if [[ "$(uname -s)" == *"MINGW"* || "$(uname -s)" == *"MSYS"* ]]; then
    IS_WINDOWS=true
    echo -e "${YELLOW}Detectado ambiente Windows${NC}"
fi

# Verificar se Docker Desktop está rodando (Windows)
if [ "$IS_WINDOWS" = true ]; then
    if ! tasklist 2>/dev/null | grep -i "Docker Desktop.exe" &>/dev/null; then
        echo -e "${RED}Docker Desktop não está em execução. Por favor, inicie o Docker Desktop antes de continuar.${NC}"
        echo -e "${YELLOW}Tentando iniciar o Docker Desktop automaticamente...${NC}"
        start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"
        echo -e "${YELLOW}Aguarde alguns segundos para o Docker Desktop iniciar...${NC}"
        sleep 10
    fi
fi

# Verificar qual comando de docker compose usar
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo -e "${RED}Docker Compose não encontrado. Por favor, instale o Docker Compose antes de continuar.${NC}"
    exit 1
fi

# Função para exibir o menu
show_menu() {
    clear
    echo -e "${BLUE}===== Ambiente Docker Bicho Solto =====${NC}"
    echo ""
    echo " [1] Iniciar ambiente"
    echo " [2] Parar ambiente"
    echo " [3] Ver logs"
    echo " [4] Reconstruir ambiente (reset)"
    echo " [5] Ver status dos contêineres"
    echo " [0] Sair"
    echo ""
    read -p "Selecione uma opção: " option

    case $option in
        1)
            echo ""
            echo -e "${GREEN}Iniciando ambiente Bicho Solto...${NC}"
            echo ""
            MSYS_NO_PATHCONV=1 $COMPOSE_CMD up -d
            if [ $? -eq 0 ]; then
                echo ""
                echo -e "${GREEN}===== Ambiente iniciado com sucesso! =====${NC}"
                echo ""
                echo "Frontend: http://localhost:3000"
                echo "Backend: http://localhost:5000"
                echo "PgAdmin: http://localhost:8080"
                echo "  - Email: admin@bischosolto.com"
                echo "  - Senha: admin"
                echo ""
            else
                echo ""
                echo -e "${RED}===== ERRO ao iniciar os containers =====${NC}"
                echo ""
            fi
            read -p "Pressione Enter para continuar..."
            show_menu
            ;;
        2)
            echo ""
            echo -e "${GREEN}Parando ambiente Bicho Solto...${NC}"
            echo ""
            MSYS_NO_PATHCONV=1 $COMPOSE_CMD down
            echo ""
            echo "Ambiente parado."
            read -p "Pressione Enter para continuar..."
            show_menu
            ;;
        3)
            echo ""
            echo -e "${GREEN}Exibindo logs (pressione Ctrl+C para sair)...${NC}"
            echo ""
            MSYS_NO_PATHCONV=1 $COMPOSE_CMD logs -f
            show_menu
            ;;
        4)
            echo ""
            echo -e "${YELLOW}ATENÇÃO: Esta ação irá remover todos os dados e volumes.${NC}"
            echo ""
            read -p "Tem certeza que deseja continuar? (S/N): " confirmation
            if [[ $confirmation == [Ss] ]]; then
                echo ""
                echo "Removendo containers, volumes e reconstruindo..."
                MSYS_NO_PATHCONV=1 $COMPOSE_CMD down -v
                MSYS_NO_PATHCONV=1 $COMPOSE_CMD up -d --build
                echo ""
                echo "Ambiente reconstruído."
            else
                echo ""
                echo "Operação cancelada."
            fi
            read -p "Pressione Enter para continuar..."
            show_menu
            ;;
        5)
            echo ""
            echo "Status dos contêineres:"
            echo ""
            MSYS_NO_PATHCONV=1 $COMPOSE_CMD ps
            read -p "Pressione Enter para continuar..."
            show_menu
            ;;
        0)
            echo ""
            echo -e "${BLUE}Saindo...${NC}"
            exit 0
            ;;
        *)
            echo ""
            echo -e "${RED}Opção inválida!${NC}"
            read -p "Pressione Enter para continuar..."
            show_menu
            ;;
    esac
}

# Iniciar o menu
show_menu 