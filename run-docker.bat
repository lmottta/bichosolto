@echo off
setlocal enabledelayedexpansion

:: Verificar se Docker Desktop está rodando
echo Verificando se Docker Desktop esta rodando...
tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>NUL | find /I /N "Docker Desktop.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo Docker Desktop nao esta rodando. Tentando iniciar...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Aguardando Docker iniciar (15 segundos)...
    timeout /t 15
) else (
    echo Docker Desktop esta rodando.
)

:: Mostrar menu
:MENU
cls
echo.
echo ===== Ambiente Docker Bicho Solto =====
echo.
echo  [1] Iniciar ambiente
echo  [2] Parar ambiente
echo  [3] Ver logs
echo  [4] Reconstruir ambiente (reset)
echo  [5] Ver status dos conteineres
echo  [0] Sair
echo.

set /p opcao="Selecione uma opcao: "

:: Verificar qual comando de docker compose usar
set COMPOSE_COMMAND=
docker-compose --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set COMPOSE_COMMAND=docker-compose
) else (
    docker compose version >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set COMPOSE_COMMAND=docker compose
    ) else (
        echo Docker Compose nao encontrado.
        echo Verifique se o Docker Desktop esta instalado corretamente.
        pause
        goto MENU
    )
)

:: Processar opcao
if "%opcao%"=="1" (
    echo.
    echo Iniciando ambiente Bicho Solto...
    echo.
    %COMPOSE_COMMAND% up -d
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ===== Ambiente iniciado com sucesso! =====
        echo.
        echo Frontend: http://localhost:3000
        echo Backend: http://localhost:5000
        echo PgAdmin: http://localhost:8080
        echo   - Email: admin@bischosolto.com
        echo   - Senha: admin
        echo.
    ) else (
        echo.
        echo ===== ERRO ao iniciar os containers =====
        echo.
    )
    pause
    goto MENU
)

if "%opcao%"=="2" (
    echo.
    echo Parando ambiente Bicho Solto...
    echo.
    %COMPOSE_COMMAND% down
    echo.
    echo Ambiente parado.
    pause
    goto MENU
)

if "%opcao%"=="3" (
    echo.
    echo Exibindo logs (pressione Ctrl+C para sair)...
    echo.
    %COMPOSE_COMMAND% logs -f
    goto MENU
)

if "%opcao%"=="4" (
    echo.
    echo ATENCAO: Esta acao ira remover todos os dados e volumes.
    echo.
    set /p confirmacao="Tem certeza que deseja continuar? (S/N): "
    if /I "!confirmacao!"=="S" (
        echo.
        echo Removendo containers, volumes e reconstruindo...
        %COMPOSE_COMMAND% down -v
        %COMPOSE_COMMAND% up -d --build
        echo.
        echo Ambiente reconstruido.
    ) else (
        echo.
        echo Operacao cancelada.
    )
    pause
    goto MENU
)

if "%opcao%"=="5" (
    echo.
    echo Status dos conteineres:
    echo.
    %COMPOSE_COMMAND% ps
    pause
    goto MENU
)

if "%opcao%"=="0" (
    echo.
    echo Saindo...
    exit /b 0
) else (
    if not "%opcao%"=="1" if not "%opcao%"=="2" if not "%opcao%"=="3" if not "%opcao%"=="4" if not "%opcao%"=="5" (
        echo.
        echo Opcao invalida!
        pause
    )
    goto MENU
) 