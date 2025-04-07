# Plano de Hospedagem no Railway

## Visão Geral

Este documento descreve o plano para hospedar a aplicação Bicho Solto no Railway, aproveitando o banco de dados PostgreSQL já existente em `postgres-production-56cd.up.railway.app`.

## Estrutura do Projeto

O projeto consiste em:
- **Frontend**: Aplicação React com Vite
- **Backend**: API Node.js/Express
- **Banco de Dados**: PostgreSQL (já existente no Railway)

## Configuração do Banco de Dados

### Conexão com o PostgreSQL existente

O banco de dados PostgreSQL já está hospedado no Railway com o seguinte endpoint:
```
postgres-production-56cd.up.railway.app
```

Será necessário configurar as seguintes variáveis de ambiente para conexão:

```
DB_HOST=postgres-production-56cd.up.railway.app
DB_PORT=5432
DB_NAME=bicho_solto_db (ou o nome configurado no Railway)
DB_USER=postgres (ou o usuário configurado no Railway)
DB_PASSWORD=<senha_do_banco> (obter do painel do Railway)
```

## Plano de Implantação

### 1. Preparação do Backend

1. **Atualizar o arquivo railway.toml**:
   ```toml
   [build]
   builder = "nixpacks"
   buildCommand = "npm install"

   [deploy]
   startCommand = "npm start"
   healthcheckPath = "/health"
   healthcheckTimeout = 100
   restartPolicyType = "ON_FAILURE"
   ```

2. **Configurar variáveis de ambiente no Railway**:
   - `PORT`: 5000
   - `NODE_ENV`: production
   - `API_URL`: URL do serviço backend (será gerado pelo Railway)
   - `DB_HOST`: postgres-production-56cd.up.railway.app
   - `DB_PORT`: 5432
   - `DB_NAME`: bicho_solto_db (ou o nome configurado)
   - `DB_USER`: postgres (ou o usuário configurado)
   - `DB_PASSWORD`: <senha_do_banco>
   - `JWT_SECRET`: <chave_secreta_para_jwt>
   - `JWT_EXPIRES_IN`: 7d
   - `UPLOAD_DIR`: uploads
   - `MAX_FILE_SIZE`: 5242880
   - `GOOGLE_MAPS_API_KEY`: <sua_chave_api_google_maps>

3. **Implantar o backend no Railway**:
   ```bash
   # Na pasta do backend
   railway link # Vincular ao projeto Railway
   railway up   # Implantar o serviço
   ```

### 2. Preparação do Frontend

1. **Atualizar o arquivo .env do frontend**:
   ```
   VITE_API_URL=https://<url-do-backend-no-railway>
   ```

2. **Configurar variáveis de ambiente no Railway**:
   - `PORT`: 80
   - `VITE_API_URL`: URL completa do backend no Railway

3. **Implantar o frontend no Railway**:
   ```bash
   # Na pasta do frontend
   railway link # Vincular ao projeto Railway
   railway up   # Implantar o serviço
   ```

### 3. Configuração do Railway.json na raiz do projeto

Atualizar o arquivo `railway.json` na raiz do projeto:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks",
    "buildCommand": "echo 'Configuração do Railway'"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "docker-compose -f docker-compose.railway.yml up",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### 4. Atualizar o docker-compose.railway.yml

Ajustar o arquivo `docker-compose.railway.yml` para usar o banco de dados existente:

```yaml
version: '3.8'

services:
  # Serviço do frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always
    ports:
      - "${PORT:-80}:80"
    environment:
      - VITE_API_URL=${API_URL}
    depends_on:
      - backend

  # Serviço do backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - NODE_ENV=production
      - API_URL=${API_URL}
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT}
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
      - UPLOAD_DIR=uploads
      - MAX_FILE_SIZE=5242880
      - GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
    volumes:
      - railway_uploads:/app/uploads

volumes:
  railway_uploads:
```

## Passos para Implantação

1. **Criar um novo projeto no Railway**
   - Acesse o painel do Railway e crie um novo projeto
   - Vincule o repositório GitHub ou use o CLI do Railway

2. **Configurar as variáveis de ambiente**
   - Configure todas as variáveis listadas acima no painel do Railway

3. **Implantar os serviços**
   - Implante o backend primeiro
   - Após o backend estar online, implante o frontend
   - Configure o frontend para usar a URL do backend

4. **Verificar a implantação**
   - Teste a aplicação acessando a URL do frontend fornecida pelo Railway
   - Verifique os logs para identificar possíveis problemas

## Monitoramento e Manutenção

1. **Monitorar os logs**
   - Use o painel do Railway para monitorar os logs do backend e frontend

2. **Backup do banco de dados**
   - Configure backups automáticos do banco de dados no Railway

3. **Escalonamento**
   - Ajuste os recursos conforme necessário no painel do Railway

## Considerações de Segurança

1. **Variáveis de ambiente**
   - Nunca armazene senhas ou chaves de API no código
   - Use as variáveis de ambiente do Railway para todos os segredos

2. **HTTPS**
   - O Railway fornece HTTPS por padrão para todos os domínios

3. **Proteção de rotas**
   - Certifique-se de que todas as rotas sensíveis estejam protegidas por autenticação JWT