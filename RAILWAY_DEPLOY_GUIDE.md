# Guia de Implantação no Railway - Projeto Bicho Solto

Este guia contém instruções específicas para implantação do projeto Bicho Solto no Railway usando as credenciais do banco de dados PostgreSQL existente.

## 1. Informações do Banco de Dados PostgreSQL

As seguintes credenciais de banco de dados devem ser usadas:

- **Host**: monorail.proxy.rlwy.net
- **Porta**: 48704
- **Nome do Banco**: railway
- **Usuário**: postgres
- **Senha**: trHjXCnIPMLvaSVddPKwNxGGMgjUUhbh

## 2. Implantação Passo a Passo

### 2.1 Instale a CLI do Railway

```bash
npm install -g @railway/cli
```

### 2.2 Faça login no Railway

```bash
railway login
```

### 2.3 Link ao projeto existente ou crie um novo

```bash
# Listar projetos
railway project list

# Linkar ao projeto (substitua <PROJECT_ID> pelo ID real)
railway link <PROJECT_ID>

# OU criar um novo projeto
railway project create "BichoSolto"
```

### 2.4 Configure as variáveis de ambiente

```bash
# Configurações do banco de dados
railway variables set DB_HOST=monorail.proxy.rlwy.net
railway variables set DB_PORT=48704
railway variables set DB_NAME=railway
railway variables set DB_USER=postgres
railway variables set DB_PASSWORD=trHjXCnIPMLvaSVddPKwNxGGMgjUUhbh

# Outras configurações necessárias
railway variables set JWT_SECRET=Yhsjdshdiuwew12@
railway variables set JWT_EXPIRES_IN=7d
railway variables set API_URL=https://bichosolto-production.up.railway.app
railway variables set PORT=3000
railway variables set NODE_ENV=production
railway variables set GOOGLE_MAPS_API_KEY=AIzaSyC7_3XFwXiqZRICVjloOfO9u-hGD1Ei31k

# Configurações de email (substitua <EMAIL_PASSWORD> pela senha real)
railway variables set EMAIL_HOST=smtp.gmail.com
railway variables set EMAIL_PORT=587
railway variables set EMAIL_USER=dev.lamota@gmail.com
railway variables set EMAIL_PASSWORD=<EMAIL_PASSWORD>
```

### 2.5 Inicie a implantação

```bash
railway up
```

### 2.6 Verifique o status e obtenha a URL do serviço

```bash
railway service
railway open
```

## 3. Informações Adicionais

- O script `deploy-railway.sh` automatiza todo esse processo
- O arquivo `docker-compose.railway.yml` configura os serviços de frontend e backend
- O banco de dados PostgreSQL já está configurado no Railway com o ID "postgres-production"

## 4. Verificação Pós-Implantação

Após a implantação, verifique a conexão com o banco de dados acessando:

```
https://[URL_DA_SUA_APLICACAO]/api/diagnostico
```

## 5. Solução de Problemas

- Se houver problemas de conexão com o banco de dados, verifique se as credenciais estão corretas e se o serviço PostgreSQL está ativo no Railway
- Para problemas com uploads de arquivos, verifique se o volume Railway está configurado corretamente
- Para outros problemas, consulte os logs usando `railway logs` 