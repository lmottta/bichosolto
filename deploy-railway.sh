#!/bin/bash
# Script para implantação no Railway passo a passo

echo "Iniciando processo de implantação no Railway..."

# Verificar se o CLI do Railway está instalado
if ! command -v railway &> /dev/null
then
    echo "CLI do Railway não encontrado. Instalando..."
    npm install -g @railway/cli
fi

# Login no Railway (abrirá navegador para autenticação)
echo "Fazendo login no Railway. Uma janela do navegador será aberta..."
railway login || { echo "Falha ao fazer login no Railway. Abortando."; exit 1; }

echo "Login realizado com sucesso!"

# Listar projetos disponíveis
echo "Listando projetos disponíveis no Railway..."
railway project list

# Selecionar ou criar o projeto
echo "Digite o ID do projeto ou digite 'new' para criar um novo projeto: "
read PROJECT_CHOICE

if [ "$PROJECT_CHOICE" = "new" ]; then
    echo "Digite o nome do novo projeto: "
    read PROJECT_NAME
    echo "Criando novo projeto $PROJECT_NAME..."
    railway project create "$PROJECT_NAME" || { echo "Falha ao criar o projeto. Abortando."; exit 1; }
else
    echo "Linkando ao projeto existente..."
    railway link "$PROJECT_CHOICE" || { echo "Falha ao linkar ao projeto. Abortando."; exit 1; }
fi

echo "Projeto linkado com sucesso!"

# Configurar variáveis de ambiente
echo "Configurando variáveis de ambiente..."

# Configurações específicas obrigatórias
echo "Configurando variáveis específicas do banco de dados..."
railway variables set DB_HOST=monorail.proxy.rlwy.net || { echo "Falha ao configurar DB_HOST. Continuando..."; }
railway variables set DB_PORT=48704 || { echo "Falha ao configurar DB_PORT. Continuando..."; }
railway variables set DB_NAME=railway || { echo "Falha ao configurar DB_NAME. Continuando..."; }
railway variables set DB_USER=postgres || { echo "Falha ao configurar DB_USER. Continuando..."; }
railway variables set DB_PASSWORD=trHjXCnIPMLvaSVddPKwNxGGMgjUUhbh || { echo "Falha ao configurar DB_PASSWORD. Continuando..."; }
railway variables set JWT_SECRET=Yhsjdshdiuwew12@ || { echo "Falha ao configurar JWT_SECRET. Continuando..."; }
railway variables set JWT_EXPIRES_IN=7d || { echo "Falha ao configurar JWT_EXPIRES_IN. Continuando..."; }
railway variables set API_URL=https://bichosolto-production.up.railway.app || { echo "Falha ao configurar API_URL. Continuando..."; }
railway variables set PORT=3000 || { echo "Falha ao configurar PORT. Continuando..."; }
railway variables set NODE_ENV=production || { echo "Falha ao configurar NODE_ENV. Continuando..."; }
railway variables set GOOGLE_MAPS_API_KEY=AIzaSyC7_3XFwXiqZRICVjloOfO9u-hGD1Ei31k || { echo "Falha ao configurar GOOGLE_MAPS_API_KEY. Continuando..."; }
railway variables set EMAIL_HOST=smtp.gmail.com || { echo "Falha ao configurar EMAIL_HOST. Continuando..."; }
railway variables set EMAIL_PORT=587 || { echo "Falha ao configurar EMAIL_PORT. Continuando..."; }
railway variables set EMAIL_USER=dev.lamota@gmail.com || { echo "Falha ao configurar EMAIL_USER. Continuando..."; }

# Solicitar senha de email ao usuário
echo "Digite a senha para o email (dev.lamota@gmail.com): "
read -s EMAIL_PASSWORD
echo ""
railway variables set EMAIL_PASSWORD="$EMAIL_PASSWORD" || { echo "Falha ao configurar EMAIL_PASSWORD. Continuando..."; }

# Iniciar a implantação
echo "Iniciando implantação no Railway..."
railway up || { echo "Falha na implantação. Verifique os logs para mais detalhes."; exit 1; }

echo "Implantação concluída!"

# Obter a URL do serviço
echo "Obtendo a URL do serviço..."
railway service

echo "Processo de implantação finalizado."
echo "Para abrir o aplicativo no navegador, execute: railway open" 