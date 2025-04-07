#!/bin/bash

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir mensagens de status
status() {
  echo -e "${BLUE}=== $1 ===${NC}"
}

success() {
  echo -e "${GREEN}✓ $1${NC}"
}

warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

error() {
  echo -e "${RED}✗ $1${NC}"
}

# Verificar se o Docker está instalado e em execução
if ! command -v docker &> /dev/null; then
  error "Docker não está instalado. Por favor, instale o Docker antes de continuar."
  exit 1
fi

if ! docker info &> /dev/null; then
  error "Docker não está em execução. Por favor, inicie o Docker antes de continuar."
  exit 1
fi

# Função para limpar e reiniciar
reset_environment() {
  status "Parando e removendo contêineres existentes"
  docker-compose -f docker-compose.railway-local.yml down -v
  success "Ambiente anterior removido com sucesso"
}

# Função para iniciar o ambiente
start_environment() {
  status "Construindo e iniciando o ambiente Railway local"
  docker-compose -f docker-compose.railway-local.yml up -d --build

  if [ $? -eq 0 ]; then
    success "Ambiente Railway local iniciado com sucesso!"
    echo -e "${GREEN}O frontend estará disponível em: ${YELLOW}http://localhost:3000${NC}"
    echo -e "${GREEN}O backend estará disponível em: ${YELLOW}http://localhost:5001${NC}"
  else
    error "Erro ao iniciar o ambiente Railway local."
    exit 1
  fi
}

# Função para mostrar logs
show_logs() {
  status "Exibindo logs dos serviços"
  docker-compose -f docker-compose.railway-local.yml logs -f
}

# Menu de opções
show_menu() {
  echo -e "${BLUE}"
  echo "=========================================="
  echo "    Ambiente Railway Local - Bicho Solto  "
  echo "=========================================="
  echo -e "${NC}"
  echo "1. Iniciar ambiente completo (reset + start)"
  echo "2. Apenas iniciar serviços"
  echo "3. Parar todos os serviços"
  echo "4. Ver logs dos serviços"
  echo "5. Reiniciar apenas o backend"
  echo "6. Reiniciar apenas o frontend"
  echo "7. Verificar status"
  echo "8. Limpar e remover tudo"
  echo "0. Sair"
  echo ""
  echo -n "Escolha uma opção: "
}

# Verificar status dos serviços
check_status() {
  status "Status dos serviços"
  docker-compose -f docker-compose.railway-local.yml ps
}

# Função principal
main() {
  if [ "$1" == "start" ]; then
    reset_environment
    start_environment
    exit 0
  fi

  if [ "$1" == "stop" ]; then
    status "Parando serviços"
    docker-compose -f docker-compose.railway-local.yml down
    success "Serviços parados com sucesso"
    exit 0
  fi

  if [ "$1" == "logs" ]; then
    show_logs
    exit 0
  fi

  if [ -z "$1" ]; then
    # Sem argumentos, mostrar menu interativo
    while true; do
      show_menu
      read choice

      case $choice in
        1)
          reset_environment
          start_environment
          ;;
        2)
          start_environment
          ;;
        3)
          docker-compose -f docker-compose.railway-local.yml down
          success "Serviços parados com sucesso"
          ;;
        4)
          show_logs
          ;;
        5)
          status "Reiniciando backend"
          docker-compose -f docker-compose.railway-local.yml restart backend
          success "Backend reiniciado"
          ;;
        6)
          status "Reiniciando frontend"
          docker-compose -f docker-compose.railway-local.yml restart frontend
          success "Frontend reiniciado"
          ;;
        7)
          check_status
          ;;
        8)
          reset_environment
          ;;
        0)
          echo "Saindo..."
          exit 0
          ;;
        *)
          error "Opção inválida"
          ;;
      esac

      echo
      echo -n "Pressione ENTER para continuar..."
      read
      clear
    done
  else
    error "Comando não reconhecido: $1"
    echo "Uso: $0 [start|stop|logs]"
    exit 1
  fi
}

# Executar função principal
main "$@" 