#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Script de Configuração do Ambiente Railway para Bicho Solto ===${NC}\n"

# Verificar se estamos no Windows
IS_WINDOWS=false
if [[ "$(uname -s)" == *"MINGW"* || "$(uname -s)" == *"MSYS"* ]]; then
    IS_WINDOWS=true
    echo -e "${YELLOW}Detectado ambiente Windows${NC}"
fi

# Verificar se Docker Desktop está rodando (Windows)
if [ "$IS_WINDOWS" = true ]; then
    if ! tasklist 2>NUL | findstr /i "com.docker.backend" >NUL; then
        echo -e "${RED}Docker Desktop não está em execução. Por favor, inicie o Docker Desktop antes de continuar.${NC}"
        echo -e "${YELLOW}Tentando iniciar o Docker Desktop automaticamente...${NC}"
        start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"
        echo -e "${YELLOW}Aguarde alguns segundos para o Docker Desktop iniciar...${NC}"
        sleep 10
    fi
fi

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker não encontrado. Por favor, instale o Docker antes de continuar.${NC}"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    # Para Docker Desktop mais recente, o 'docker compose' (sem hífen) é o padrão
    if ! docker compose version &> /dev/null; then
        echo -e "${RED}Docker Compose não encontrado. Por favor, instale o Docker Compose antes de continuar.${NC}"
        exit 1
    else
        echo -e "${YELLOW}Usando 'docker compose' ao invés de 'docker-compose'${NC}"
        COMPOSE_CMD="docker compose"
    fi
else
    COMPOSE_CMD="docker-compose"
fi

# Menu de opções
echo -e "${YELLOW}Escolha uma opção:${NC}"
echo "1. Iniciar ambiente de desenvolvimento local"
echo "2. Parar ambiente de desenvolvimento local"
echo "3. Visualizar logs do ambiente local"
echo "4. Limpar volumes e reconstruir ambiente local"
echo "5. Preparar para deploy no Railway"
echo "6. Verificar status dos contêineres"
echo "0. Sair"

read -p "Opção: " option

case $option in
    1)
        echo -e "${GREEN}Iniciando ambiente de desenvolvimento local...${NC}"
        if [ "$IS_WINDOWS" = true ]; then
            MSYS_NO_PATHCONV=1 $COMPOSE_CMD up -d
        else
            $COMPOSE_CMD up -d
        fi
        echo -e "${GREEN}Ambiente iniciado! Acesse:${NC}"
        echo "Frontend: http://localhost:3000"
        echo "Backend API: http://localhost:5000"
        echo "PgAdmin: http://localhost:8080 (email: admin@bischosolto.com, senha: admin)"
        ;;
    2)
        echo -e "${GREEN}Parando ambiente de desenvolvimento local...${NC}"
        if [ "$IS_WINDOWS" = true ]; then
            MSYS_NO_PATHCONV=1 $COMPOSE_CMD down
        else
            $COMPOSE_CMD down
        fi
        echo -e "${GREEN}Ambiente parado com sucesso!${NC}"
        ;;
    3)
        echo -e "${GREEN}Visualizando logs. Pressione Ctrl+C para sair.${NC}"
        if [ "$IS_WINDOWS" = true ]; then
            MSYS_NO_PATHCONV=1 $COMPOSE_CMD logs -f
        else
            $COMPOSE_CMD logs -f
        fi
        ;;
    4)
        echo -e "${YELLOW}ATENÇÃO: Esta ação irá remover todos os volumes e dados.${NC}"
        read -p "Deseja continuar? (s/n): " confirm
        if [[ $confirm == [sS] ]]; then
            echo -e "${GREEN}Removendo contêineres, volumes e reconstruindo ambiente...${NC}"
            if [ "$IS_WINDOWS" = true ]; then
                MSYS_NO_PATHCONV=1 $COMPOSE_CMD down -v
                MSYS_NO_PATHCONV=1 $COMPOSE_CMD up -d --build
            else
                $COMPOSE_CMD down -v
                $COMPOSE_CMD up -d --build
            fi
            echo -e "${GREEN}Ambiente reconstruído com sucesso!${NC}"
        else
            echo -e "${BLUE}Operação cancelada.${NC}"
        fi
        ;;
    5)
        echo -e "${GREEN}Preparando para deploy no Railway...${NC}"
        
        # Verificar se railway CLI está instalado
        if ! command -v railway &> /dev/null; then
            echo -e "${YELLOW}Railway CLI não encontrado. Deseja instalar? (s/n)${NC}"
            read -p "> " install_railway
            if [[ $install_railway == [sS] ]]; then
                npm i -g @railway/cli
            else
                echo -e "${BLUE}Por favor, instale manualmente a Railway CLI: npm i -g @railway/cli${NC}"
                exit 1
            fi
        fi
        
        echo -e "${BLUE}Fazendo login no Railway...${NC}"
        railway login
        
        echo -e "${BLUE}Iniciando projeto Railway...${NC}"
        railway init
        
        echo -e "${BLUE}Seus arquivos estão prontos para deploy!${NC}"
        echo -e "${YELLOW}Para fazer o deploy, execute:${NC} railway up"
        ;;
    6)
        echo -e "${GREEN}Status dos contêineres:${NC}"
        if [ "$IS_WINDOWS" = true ]; then
            MSYS_NO_PATHCONV=1 $COMPOSE_CMD ps
        else
            $COMPOSE_CMD ps
        fi
        ;;
    0)
        echo -e "${BLUE}Saindo...${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Opção inválida!${NC}"
        ;;
esac 