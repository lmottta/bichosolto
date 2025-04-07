#!/bin/bash

# Script de configuração para implantação no Railway

echo "=== Configurando projeto para implantação no Railway ==="

# Verificar se o CLI do Railway está instalado
if ! command -v railway &> /dev/null; then
    echo "CLI do Railway não encontrado. Instalando..."
    npm install -g @railway/cli
fi

# Fazer login no Railway (se necessário)
echo "Faça login no Railway se solicitado"
railway login

# Criar novo projeto no Railway (ou vincular a um existente)
echo "Criando/vinculando projeto no Railway"
railway init

# Configurar variáveis de ambiente para o backend
echo "Configurando variáveis de ambiente para o backend"
railway vars set \
    PORT=5000 \
    NODE_ENV=production \
    DB_HOST=postgres-production-56cd.up.railway.app \
    DB_PORT=5432 \
    DB_NAME=bicho_solto_db \
    DB_USER=postgres \
    JWT_EXPIRES_IN=7d \
    UPLOAD_DIR=uploads \
    MAX_FILE_SIZE=5242880

echo "IMPORTANTE: Configure manualmente as seguintes variáveis sensíveis no painel do Railway:"
echo "- DB_PASSWORD: Senha do banco de dados PostgreSQL"
echo "- JWT_SECRET: Chave secreta para autenticação JWT"
echo "- GOOGLE_MAPS_API_KEY: Chave da API do Google Maps (se necessário)"

# Instruções para implantação
echo ""
echo "=== Instruções para implantação ==="
echo "1. Acesse o painel do Railway: https://railway.app/dashboard"
echo "2. Configure as variáveis sensíveis mencionadas acima"
echo "3. Implante o backend executando: cd backend && railway up"
echo "4. Após o backend estar online, obtenha a URL gerada pelo Railway"
echo "5. Configure a variável VITE_API_URL no frontend com a URL do backend"
echo "6. Implante o frontend executando: cd frontend && railway up"
echo ""
echo "=== Verificação pós-implantação ==="
echo "1. Verifique os logs do backend e frontend no painel do Railway"
echo "2. Teste a aplicação acessando a URL do frontend fornecida pelo Railway"
echo "3. Verifique a conexão com o banco de dados acessando a rota /health do backend"

echo ""
echo "Configuração concluída! Siga as instruções acima para completar a implantação."