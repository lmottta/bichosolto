@echo off
echo Iniciando processo de implantacao no Railway...

REM Verificar se o CLI do Railway esta instalado
where railway >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo CLI do Railway nao encontrado. Instalando...
    call npm install -g @railway/cli
)

REM Login no Railway
echo Fazendo login no Railway. Uma janela do navegador sera aberta...
call railway login
if %ERRORLEVEL% NEQ 0 (
    echo Falha ao fazer login no Railway. Abortando.
    exit /b 1
)

echo Login realizado com sucesso!

REM Listar projetos disponiveis
echo Listando projetos disponiveis no Railway...
call railway project list

REM Selecionar ou criar o projeto
set /p PROJECT_CHOICE=Digite o ID do projeto ou digite 'new' para criar um novo projeto: 

if "%PROJECT_CHOICE%"=="new" (
    set /p PROJECT_NAME=Digite o nome do novo projeto: 
    echo Criando novo projeto %PROJECT_NAME%...
    call railway project create "%PROJECT_NAME%"
    if %ERRORLEVEL% NEQ 0 (
        echo Falha ao criar o projeto. Abortando.
        exit /b 1
    )
) else (
    echo Linkando ao projeto existente...
    call railway link "%PROJECT_CHOICE%"
    if %ERRORLEVEL% NEQ 0 (
        echo Falha ao linkar ao projeto. Abortando.
        exit /b 1
    )
)

echo Projeto linkado com sucesso!

REM Configurar variaveis de ambiente
echo Configurando variaveis de ambiente...

REM Configuracoes especificas obrigatorias
echo Configurando variaveis especificas do banco de dados...
call railway variables set API_URL=https://bichosolto-production.up.railway.app
call railway variables set DB_HOST=monorail.proxy.rlwy.net
call railway variables set DB_PORT=48704
call railway variables set DB_NAME=railway
call railway variables set DB_USER=postgres
call railway variables set DB_PASSWORD=trHjXCnIPMLvaSVddPKwNxGGMgjUUhbh
call railway variables set JWT_SECRET=seu_segredo_jwt_aqui
call railway variables set JWT_EXPIRES_IN=7d
call railway variables set PORT=3000
call railway variables set NODE_ENV=production
call railway variables set GOOGLE_MAPS_API_KEY=AIzaSyC7_3XFwXiqZRICVjloOfO9u-hGD1Ei31k
call railway variables set EMAIL_HOST=smtp.gmail.com
call railway variables set EMAIL_PORT=587
call railway variables set EMAIL_USER=dev.lamota@gmail.com

REM Solicitar senha de email ao usuario
set /p EMAIL_PASSWORD=Digite a senha para o email (dev.lamota@gmail.com): 
call railway variables set EMAIL_PASSWORD="%EMAIL_PASSWORD%"

REM Iniciar a implantacao
echo Iniciando implantacao no Railway...
call railway up
if %ERRORLEVEL% NEQ 0 (
    echo Falha na implantacao. Verifique os logs para mais detalhes.
    exit /b 1
)

echo Implantacao concluida!

REM Obter a URL do servico
echo Obtendo a URL do servico...
call railway service

echo Processo de implantacao finalizado.
echo Para abrir o aplicativo no navegador, execute: railway open
pause 