#!/bin/sh

# Script para verificar se o PostgreSQL está pronto antes de iniciar a aplicação

# Verifica se a variável DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
  echo "Variável DATABASE_URL não está definida, pulando verificação do PostgreSQL"
  exit 0
fi

# Extrair host e porta do DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

# Se não conseguir extrair a porta, usar a porta padrão 5432
if [ -z "$DB_PORT" ]; then
  DB_PORT=5432
fi

echo "Verificando conexão com PostgreSQL em $DB_HOST:$DB_PORT"

# Tentar conexão com o banco de dados
for i in $(seq 1 30); do
  echo "Tentativa $i de 30..."
  
  # Usar nc (netcat) para verificar se a porta está aberta
  if nc -z $DB_HOST $DB_PORT; then
    echo "PostgreSQL está pronto!"
    exit 0
  fi
  
  echo "PostgreSQL ainda não está pronto, aguardando 1 segundo..."
  sleep 1
done

echo "Não foi possível conectar ao PostgreSQL após 30 tentativas."
echo "Iniciando a aplicação mesmo assim, mas podem ocorrer erros de conexão."
exit 0 