# Script para implantação no Railway usando PowerShell
Write-Host "Iniciando processo de implantação no Railway..." -ForegroundColor Cyan

# Verificar se o CLI do Railway está instalado
try {
    $null = Get-Command railway -ErrorAction Stop
    Write-Host "CLI do Railway já está instalado." -ForegroundColor Green
} catch {
    Write-Host "CLI do Railway não encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g @railway/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Falha ao instalar o CLI do Railway. Abortando." -ForegroundColor Red
        exit 1
    }
}

# Login no Railway
Write-Host "Fazendo login no Railway. Uma janela do navegador será aberta..." -ForegroundColor Cyan
railway login
if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha ao fazer login no Railway. Abortando." -ForegroundColor Red
    exit 1
}

Write-Host "Login realizado com sucesso!" -ForegroundColor Green

# Listar projetos disponíveis
Write-Host "Listando projetos disponíveis no Railway..." -ForegroundColor Cyan
railway project list

# Selecionar ou criar o projeto
$PROJECT_CHOICE = Read-Host "Digite o ID do projeto ou digite 'new' para criar um novo projeto"

if ($PROJECT_CHOICE -eq "new") {
    $PROJECT_NAME = Read-Host "Digite o nome do novo projeto"
    Write-Host "Criando novo projeto $PROJECT_NAME..." -ForegroundColor Cyan
    railway project create $PROJECT_NAME
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Falha ao criar o projeto. Abortando." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Linkando ao projeto existente..." -ForegroundColor Cyan
    railway link $PROJECT_CHOICE
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Falha ao linkar ao projeto. Abortando." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Projeto linkado com sucesso!" -ForegroundColor Green

# Configurar variáveis de ambiente
Write-Host "Configurando variáveis de ambiente..." -ForegroundColor Cyan

# Configurações específicas obrigatórias
Write-Host "Configurando variáveis específicas do banco de dados..." -ForegroundColor Cyan

# Array de variáveis para configurar
$variables = @(
    @{Name="DB_HOST"; Value="monorail.proxy.rlwy.net"},
    @{Name="DB_PORT"; Value="48704"},
    @{Name="DB_NAME"; Value="railway"},
    @{Name="DB_USER"; Value="postgres"},
    @{Name="DB_PASSWORD"; Value="trHjXCnIPMLvaSVddPKwNxGGMgjUUhbh"},
    @{Name="JWT_SECRET"; Value="Yhsjdshdiuwew12@"},
    @{Name="JWT_EXPIRES_IN"; Value="7d"},
    @{Name="API_URL"; Value="https://bichosolto-production.up.railway.app"},
    @{Name="PORT"; Value="3000"},
    @{Name="NODE_ENV"; Value="production"},
    @{Name="GOOGLE_MAPS_API_KEY"; Value="AIzaSyC7_3XFwXiqZRICVjloOfO9u-hGD1Ei31k"},
    @{Name="EMAIL_HOST"; Value="smtp.gmail.com"},
    @{Name="EMAIL_PORT"; Value="587"},
    @{Name="EMAIL_USER"; Value="dev.lamota@gmail.com"}
)

# Definir cada variável
foreach ($var in $variables) {
    Write-Host "Configurando $($var.Name)..." -ForegroundColor Cyan
    railway variables set "$($var.Name)=$($var.Value)"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Aviso: Falha ao configurar $($var.Name). Continuando..." -ForegroundColor Yellow
    }
}

# Solicitar senha de email ao usuário
$EMAIL_PASSWORD = Read-Host "Digite a senha para o email (dev.lamota@gmail.com)" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($EMAIL_PASSWORD)
$EMAIL_PASSWORD_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

Write-Host "Configurando EMAIL_PASSWORD..." -ForegroundColor Cyan
railway variables set "EMAIL_PASSWORD=$EMAIL_PASSWORD_PLAIN"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Aviso: Falha ao configurar EMAIL_PASSWORD. Continuando..." -ForegroundColor Yellow
}

# Iniciar a implantação
Write-Host "Iniciando implantação no Railway..." -ForegroundColor Cyan
railway up
if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha na implantação. Verifique os logs para mais detalhes." -ForegroundColor Red
    exit 1
}

Write-Host "Implantação concluída!" -ForegroundColor Green

# Obter a URL do serviço
Write-Host "Obtendo a URL do serviço..." -ForegroundColor Cyan
railway service

Write-Host "Processo de implantação finalizado." -ForegroundColor Green
Write-Host "Para abrir o aplicativo no navegador, execute: railway open" -ForegroundColor Cyan
Read-Host "Pressione Enter para sair" 