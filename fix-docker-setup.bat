@echo off
setlocal enabledelayedexpansion

echo ===== Diagnostico e Correcao do Ambiente Bicho Solto =====
echo.

REM Verificar se Docker está instalado e rodando
echo Verificando Docker...
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Docker nao encontrado ou nao esta no PATH.
    echo Instale o Docker Desktop e tente novamente.
    goto :EOF
)

REM Verificar Docker Desktop
echo Verificando Docker Desktop...
tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>NUL | find /I /N "Docker Desktop.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo Docker Desktop nao esta rodando. Tentando iniciar...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Aguardando Docker iniciar (20 segundos)...
    timeout /t 20
) else (
    echo Docker Desktop esta rodando.
)

REM Parar containers existentes
echo.
echo Parando todos os containers...
set COMPOSE_COMMAND=
docker-compose --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set COMPOSE_COMMAND=docker-compose
) else (
    docker compose version >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set COMPOSE_COMMAND=docker compose
    ) else (
        echo ERRO: Docker Compose nao encontrado.
        goto :EOF
    )
)

%COMPOSE_COMMAND% down -v

REM Remover todos os containers do projeto
echo.
echo Removendo containers existentes...
for /f "tokens=*" %%i in ('docker ps -a -q --filter "name=bicho-solto"') do (
    echo Removendo container %%i...
    docker rm -f %%i >nul 2>&1
)

REM Verificar diretórios necessários
echo.
echo Verificando diretorios de upload...
if not exist "backend\uploads" (
    echo Criando diretorios de uploads...
    mkdir "backend\uploads\profiles" 2>nul
    mkdir "backend\uploads\events" 2>nul
    mkdir "backend\uploads\reports" 2>nul
    mkdir "backend\uploads\animals" 2>nul
) else (
    echo Diretorios de uploads existem.
)

REM Reconstruir containers
echo.
echo Reconstruindo containers com build...
%COMPOSE_COMMAND% up -d --build

REM Verificar status
echo.
echo Aguardando inicializacao completa (15 segundos)...
timeout /t 15 >nul

echo.
echo Verificando status dos containers:
%COMPOSE_COMMAND% ps

echo.
echo Verificando logs do backend (pressione Ctrl+C para sair):
%COMPOSE_COMMAND% logs backend

echo.
echo ===== Processo concluido! =====
echo Se ainda houver problemas, verifique os logs completos com: 
echo %COMPOSE_COMMAND% logs
echo.

pause 