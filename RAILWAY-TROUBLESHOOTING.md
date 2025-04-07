# Guia de Solução de Problemas para Deploy no Railway

## Problema Identificado
O deploy via CLI do Railway falhou ao tentar usar o `docker-compose.railway.yml`. O Railway tem limitações ao executar configurações complexas de Docker Compose, especialmente quando há múltiplos serviços interdependentes.

## Solução Recomendada

A melhor abordagem é implantar os serviços separadamente no Railway, em vez de usar Docker Compose. Siga estas etapas:

### 1. Implantar o Backend Primeiro

```bash
# Na pasta do backend
cd backend

# Vincular ao projeto Railway
railway link

# Configurar variáveis de ambiente necessárias
railway vars set NODE_ENV=production
railway vars set PORT=5000
railway vars set DB_HOST=postgres-production-56cd.up.railway.app
railway vars set DB_PORT=5432
railway vars set DB_NAME=bicho_solto_db
railway vars set DB_USER=postgres
railway vars set DB_PASSWORD=Nuncaperco19*
railway vars set JWT_SECRET=Yhsjdshdiuwew12@
railway vars set JWT_EXPIRES_IN=7d
railway vars set UPLOAD_DIR=uploads
railway vars set MAX_FILE_SIZE=5242880

# Implantar o backend
railway up
```

### 2. Obter a URL do Backend

Após o deploy do backend, obtenha a URL gerada pelo Railway através do dashboard ou usando o comando:

```bash
railway status
```

Anote a URL do serviço backend (algo como `https://seu-backend.railway.app`).

### 3. Implantar o Frontend

```bash
# Na pasta do frontend
cd ../frontend

# Vincular ao projeto Railway (mesmo projeto ou um novo)
railway link

# Configurar a variável de ambiente para apontar para o backend
railway vars set VITE_API_URL=https://seu-backend.railway.app

# Implantar o frontend
railway up
```

## Verificação Pós-Implantação

1. Verifique os logs de ambos os serviços no dashboard do Railway
2. Teste a aplicação acessando a URL do frontend fornecida pelo Railway
3. Verifique a conexão com o banco de dados acessando a rota `/health` do backend

## Dicas Adicionais

- **Volumes Persistentes**: O Railway não suporta volumes Docker persistentes da mesma forma que em ambiente local. Para uploads de arquivos, considere usar um serviço de armazenamento como AWS S3 ou similar.

- **Variáveis de Ambiente**: Certifique-se de que todas as variáveis de ambiente necessárias estejam configuradas no Railway para cada serviço.

- **Monitoramento**: Use o dashboard do Railway para monitorar o uso de recursos e logs dos serviços.

- **Rollback**: Se um deploy falhar, você pode facilmente reverter para uma versão anterior usando o dashboard do Railway.

## Alternativa: Deploy via Dashboard

Se preferir usar a interface web do Railway em vez da CLI:

1. Acesse [Railway Dashboard](https://railway.app/dashboard)
2. Selecione seu projeto
3. Adicione um novo serviço -> GitHub Repo ou Deploy from Template
4. Configure as variáveis de ambiente conforme listado acima
5. Repita o processo para o frontend, configurando-o como um serviço separado