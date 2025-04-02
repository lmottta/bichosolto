#!/bin/bash

# Script para provisionar e configurar o PostgreSQL no Railway

echo "Instalando a CLI do Railway (se necessário)..."
npm install -g @railway/cli

echo "Fazendo login no Railway (se você já estiver logado, isso será ignorado)..."
railway login

echo "Provisioning PostgreSQL..."
railway add --plugin postgresql

echo "Configurando variáveis de ambiente para o banco de dados..."
echo "Agora o Railway configurou automaticamente DATABASE_URL para sua aplicação."

echo "Como configurar manualmente as variáveis de ambiente necessárias:"
echo "1. Vá para o dashboard do Railway: https://railway.app/dashboard"
echo "2. Selecione seu projeto"
echo "3. Adicione as seguintes variáveis de ambiente:"
echo "   - NODE_ENV=production"
echo "   - JWT_SECRET=<uma-chave-secreta-forte>"
echo "   - API_URL=<url-do-seu-service-backend>"
echo "   - SERVICE=backend (para o serviço backend)"
echo "   - SERVICE=frontend (para o serviço frontend)"

echo "Processo concluído. Execute 'railway up' para implantar sua aplicação." 