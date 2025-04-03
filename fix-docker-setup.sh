#!/bin/bash

echo "===== Diagnóstico e Correção do Ambiente Bicho Solto ====="
echo

# Verificar se Docker está instalado e rodando
echo "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "ERRO: Docker não encontrado no PATH."
    echo "Instale o Docker Desktop e tente novamente."
    exit 1
fi

# Verificar Docker Desktop (Windows)
if [[ "$(uname -s)" == *"MINGW"* || "$(uname -s)" == *"MSYS"* ]]; then
    echo "Verificando Docker Desktop (Windows)..."
    if ! tasklist 2>/dev/null | grep -i "Docker Desktop.exe" &>/dev/null; then
        echo "Docker Desktop não está rodando. Tentando iniciar..."
        start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"
        echo "Aguardando Docker iniciar (20 segundos)..."
        sleep 20
    else
        echo "Docker Desktop está rodando."
    fi
fi

# Definir o comando Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "ERRO: Docker Compose não encontrado."
    exit 1
fi

# Parar containers existentes
echo
echo "Parando todos os containers..."
MSYS_NO_PATHCONV=1 $COMPOSE_CMD down -v

# Remover todos os containers do projeto
echo
echo "Removendo containers existentes..."
containers=$(docker ps -a -q --filter "name=bicho-solto" 2>/dev/null)
if [ -n "$containers" ]; then
    for container in $containers; do
        echo "Removendo container $container..."
        docker rm -f $container &>/dev/null
    done
fi

# Verificar diretórios necessários
echo
echo "Verificando diretórios de upload..."
if [ ! -d "backend/uploads" ]; then
    echo "Criando diretórios de uploads..."
    mkdir -p backend/uploads/profiles
    mkdir -p backend/uploads/events
    mkdir -p backend/uploads/reports
    mkdir -p backend/uploads/animals
else
    echo "Diretórios de uploads existem."
fi

# Reconstruir containers
echo
echo "Reconstruindo containers com build..."
MSYS_NO_PATHCONV=1 $COMPOSE_CMD up -d --build

# Verificar status
echo
echo "Aguardando inicialização completa (15 segundos)..."
sleep 15

echo
echo "Verificando status dos containers:"
MSYS_NO_PATHCONV=1 $COMPOSE_CMD ps

echo
echo "Verificando logs do backend (pressione Ctrl+C para sair):"
MSYS_NO_PATHCONV=1 $COMPOSE_CMD logs backend

echo
echo "===== Processo concluído! ====="
echo "Se ainda houver problemas, verifique os logs completos com:"
echo "$COMPOSE_CMD logs"
echo

read -p "Pressione Enter para continuar..." 