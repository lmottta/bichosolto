# Guia de Implantação no Railway

## Introdução

Este guia descreve o processo de implantação da aplicação Bicho Solto no Railway, utilizando o banco de dados PostgreSQL já existente em `postgres-production-56cd.up.railway.app`.

## Pré-requisitos

- Conta no [Railway](https://railway.app/)
- [Railway CLI](https://docs.railway.app/develop/cli) instalado (opcional, mas recomendado)
- Git instalado
- Node.js e npm instalados

## Estrutura do Projeto

- **Frontend**: Aplicação React com Vite
- **Backend**: API Node.js/Express
- **Banco de Dados**: PostgreSQL (já existente no Railway)

## Passo a Passo para Implantação

### 1. Preparação do Projeto

1. Clone o repositório (se ainda não tiver feito):
   ```bash
   git clone <url-do-repositorio>
   cd bichosolto_
   ```

2. Instale as dependências do backend e frontend:
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   cd ..
   ```

### 2. Configuração do Railway

#### Usando o Railway CLI

1. Instale o Railway CLI (se ainda não tiver):
   ```bash
   npm install -g @railway/cli
   ```

2. Faça login no Railway:
   ```bash
   railway login
   ```

3. Crie um novo projeto no Railway:
   ```bash
   railway init
   ```

#### Configuração do Backend

1. Navegue até a pasta do backend:
   ```bash
   cd backend
   ```

2. Vincule o diretório ao projeto Railway:
   ```bash
   railway link
   ```

3. Configure as variáveis de ambiente necessárias:
   ```bash
   railway vars set PORT=5000
   railway vars set NODE_ENV=production
   railway vars set DB_HOST=postgres-production-56cd.up.railway.app
   railway vars set DB_PORT=5432
   railway vars set DB_NAME=bicho_solto_db
   railway vars set DB_USER=postgres
   railway vars set DB_PASSWORD=<senha_do_banco>
   railway vars set JWT_SECRET=<chave_secreta_jwt>
   railway vars set JWT_EXPIRES_IN=7d
   railway vars set UPLOAD_DIR=uploads
   railway vars set MAX_FILE_SIZE=5242880
   ```

   > **Nota**: Substitua `<senha_do_banco>` e `<chave_secreta_jwt>` pelos valores reais.

4. Implante o backend no Railway:
   ```bash
   railway up
   ```

5. Após a implantação, obtenha a URL do backend:
   ```bash
   railway domain
   ```
   Anote esta URL para configurar o frontend.

#### Configuração do Frontend

1. Navegue até a pasta do frontend:
   ```bash
   cd ../frontend
   ```

2. Vincule o diretório ao projeto Railway (crie um novo serviço):
   ```bash
   railway link
   ```

3. Configure a variável de ambiente para a URL da API:
   ```bash
   railway vars set VITE_API_URL=https://<url-do-backend>
   ```
   > **Nota**: Substitua `<url-do-backend>` pela URL obtida no passo anterior.

4. Implante o frontend no Railway:
   ```bash
   railway up
   ```

5. Após a implantação, obtenha a URL do frontend:
   ```bash
   railway domain
   ```

### 3. Verificação da Implantação

1. Acesse a URL do frontend fornecida pelo Railway para verificar se a aplicação está funcionando corretamente.

2. Verifique a conexão com o backend acessando a rota de saúde:
   ```
   https://<url-do-backend>/health
   ```

## Configuração Alternativa usando o Painel Web do Railway

Se preferir usar a interface web do Railway em vez da CLI:

1. Acesse [Railway Dashboard](https://railway.app/dashboard)

2. Crie um novo projeto

3. Adicione um novo serviço -> GitHub Repo

4. Selecione o repositório do projeto

5. Configure as variáveis de ambiente conforme listado acima

6. Repita o processo para o frontend, configurando-o como um serviço separado

## Monitoramento e Manutenção

### Logs

Para visualizar os logs da aplicação:

```bash
railway logs
```

Ou acesse os logs pelo painel web do Railway.

### Atualizações

Para atualizar a aplicação após alterações no código:

```bash
git pull  # Obter as alterações mais recentes
railway up  # Reimplantar o serviço
```

## Solução de Problemas

### Problemas de Conexão com o Banco de Dados

1. Verifique se as variáveis de ambiente estão configuradas corretamente
2. Confirme se o banco de dados está acessível a partir do serviço do backend
3. Verifique os logs do backend para mensagens de erro específicas

### Problemas com o Frontend

1. Verifique se a variável `VITE_API_URL` está configurada corretamente
2. Inspecione o console do navegador para erros de conexão com a API
3. Verifique os logs do frontend no Railway

## Recursos Adicionais

- [Documentação do Railway](https://docs.railway.app/)
- [Guia de Implantação do Node.js no Railway](https://docs.railway.app/guides/nodejs)
- [Guia de Implantação do React no Railway](https://docs.railway.app/guides/react)