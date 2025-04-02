# Guia de Implantação no Railway

Este guia descreve como implantar o projeto Bicho Solto no Railway, incluindo a configuração do PostgreSQL.

## Pré-requisitos

1. Conta no [Railway](https://railway.app/)
2. [Node.js](https://nodejs.org/) instalado (versão 14 ou superior)
3. [Railway CLI](https://docs.railway.app/develop/cli) instalado:
   ```bash
   npm install -g @railway/cli
   ```

## Passo 1: Configurar o Projeto no Railway

1. Faça login no Railway via CLI:
   ```bash
   railway login
   ```

2. Inicialize seu projeto:
   ```bash
   railway init
   ```
   - Selecione "Create a new project" ou escolha um projeto existente.

## Passo 2: Provisionar o Banco de Dados PostgreSQL

### Opção 1: Usando o Script Automatizado

Execute o script de configuração incluído no projeto:
```bash
./setup-postgres.sh
```

### Opção 2: Configuração Manual

1. Adicione o PostgreSQL ao seu projeto:
   ```bash
   railway add --plugin postgresql
   ```

2. O Railway configurará automaticamente a variável de ambiente `DATABASE_URL` para seu projeto.

## Passo 3: Configurar Variáveis de Ambiente

No painel do Railway (https://railway.app/dashboard), adicione as seguintes variáveis de ambiente:

### Para o Backend:
```
NODE_ENV=production
PORT=5000
JWT_SECRET=<sua_chave_secreta>
JWT_EXPIRES_IN=7d
API_URL=<url_do_seu_serviço_backend>
SERVICE=backend
```

### Para o Frontend:
```
PORT=3000
VITE_API_URL=<url_do_seu_serviço_backend>
SERVICE=frontend
```

## Passo 4: Implantar o Backend

1. Crie um novo serviço para o backend:
   ```bash
   railway service create backend
   ```

2. Implante o backend:
   ```bash
   railway up --service backend
   ```

3. Obtenha a URL do backend:
   ```bash
   railway domain
   ```
   - Anote essa URL para configurar o frontend.

## Passo 5: Implantar o Frontend

1. Crie um novo serviço para o frontend:
   ```bash
   railway service create frontend
   ```

2. Configure a variável `VITE_API_URL` no serviço frontend com a URL do backend:
   ```bash
   railway var set VITE_API_URL=<url_do_seu_serviço_backend> --service frontend
   ```

3. Implante o frontend:
   ```bash
   railway up --service frontend
   ```

4. Configure o domínio para o frontend:
   ```bash
   railway domain
   ```

## Passo 6: Verificar a Implantação

1. Acesse as URLs fornecidas pelo Railway para verificar se seu frontend e backend estão funcionando corretamente.

2. Verifique os logs para identificar e resolver quaisquer problemas:
   ```bash
   railway logs
   ```

## Solução de Problemas

### Erro de Conexão com o Banco de Dados

Se você encontrar erros de conexão com o banco de dados, verifique:

1. Se a variável `DATABASE_URL` está configurada corretamente:
   ```bash
   railway vars
   ```

2. Se o serviço PostgreSQL está em execução:
   ```bash
   railway status
   ```

### Erro no Build do Docker

Se você encontrar erros no build do Docker, como o erro "failed to parse stage name", certifique-se de que:

1. O arquivo `Dockerfile` está configurado corretamente
2. A variável `SERVICE` está definida corretamente para cada serviço

### Arquivos de Upload Não Funcionam

Se os uploads não estiverem funcionando, verifique:

1. Se os diretórios de uploads foram criados corretamente
2. Se as permissões estão configuradas adequadamente

## Comandos Úteis do Railway

- Listar todos os serviços:
  ```bash
  railway status
  ```

- Ver logs de um serviço:
  ```bash
  railway logs --service <nome_do_serviço>
  ```

- Definir variáveis de ambiente:
  ```bash
  railway var set NOME_VAR=valor
  ```

- Listar variáveis de ambiente:
  ```bash
  railway vars
  ```

- Acessar o console do PostgreSQL:
  ```bash
  railway connect
  ``` 