# Guia de Implantação no Railway

Este guia detalha o processo de implantação do projeto Bicho Solto no Railway, utilizando o banco de dados PostgreSQL já configurado.

## Pré-requisitos

1. Conta no [Railway](https://railway.app/)
2. [Node.js](https://nodejs.org/) instalado localmente
3. Git instalado localmente
4. CLI do Railway instalado: `npm install -g @railway/cli`

## Configuração Inicial

### 1. Clone o repositório localmente (se ainda não tiver feito)

```bash
git clone <URL_DO_REPOSITORIO>
cd bichosolto_
```

### 2. Configure as variáveis de ambiente

Edite o arquivo `.env` na raiz do projeto com as informações corretas:

```
# Substitua os valores das seguintes variáveis:
DB_PASSWORD=COLOQUE_SUA_SENHA_AQUI
JWT_SECRET=GERE_UMA_CHAVE_SECRETA_AQUI
EMAIL_PASSWORD=COLOQUE_SUA_SENHA_AQUI
```

Para gerar uma chave JWT segura, você pode usar:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Implantação Automática

Execute o script de implantação:

```bash
chmod +x deploy-railway.sh
./deploy-railway.sh
```

O script vai guiá-lo pelos seguintes passos:
1. Login no Railway
2. Seleção ou criação de um projeto
3. Configuração das variáveis de ambiente
4. Implantação da aplicação

## Implantação Manual Passo a Passo

Se preferir realizar a implantação manualmente, siga estas etapas:

### 1. Login no Railway

```bash
railway login
```

### 2. Inicializar o projeto

```bash
# Listar projetos disponíveis
railway project list

# Linkar a um projeto existente
railway link <PROJECT_ID>

# OU criar um novo projeto
railway project create <NOME_DO_PROJETO>
```

### 3. Configurar variáveis de ambiente

```bash
# Exemplo de como configurar manualmente uma variável
railway variables set DB_HOST=postgres-production-56cd.up.railway.app
railway variables set DB_PORT=5432
railway variables set DB_NAME=bicho_solto_db
railway variables set DB_USER=postgres
railway variables set DB_PASSWORD=sua_senha
# ... configurar todas as outras variáveis
```

Alternativamente, importe todas as variáveis do arquivo .env:

```bash
# Instalar ferramenta para ler arquivo .env
npm install -g dotenv-cli

# Importar variáveis
dotenv -e .env railway variables set
```

### 4. Iniciar a implantação

```bash
railway up
```

### 5. Verificar status e obter URL

```bash
railway status
railway domain
```

## Estrutura de Arquivos Importantes

- `docker-compose.railway.yml`: Configuração Docker para o Railway
- `railway.json`: Configuração principal para o Railway
- `frontend/nginx.conf`: Configuração do Nginx para o frontend
- `backend/Dockerfile` e `frontend/Dockerfile`: Instruções para construção das imagens Docker

## Verificação e Depuração

### 1. Verificar logs do serviço

```bash
railway logs
```

### 2. Verificar status da aplicação

```bash
railway status
```

### 3. Acessar o serviço no navegador

```bash
railway open
```

## Migrações e Inicialização do Banco de Dados

O sistema está configurado para sincronizar automaticamente os modelos do Sequelize com o banco de dados PostgreSQL durante a inicialização do servidor.

### Verificação manual da conexão com o banco de dados

Acesse o endpoint de diagnóstico após a implantação:

```
https://[URL_DO_RAILWAY]/api/diagnostico
```

## Problemas Comuns e Soluções

### 1. Falha na conexão com o banco de dados

Verifique se as credenciais do banco de dados estão corretas nas variáveis de ambiente.

### 2. Problemas com uploads de arquivos

Verifique se o volume foi criado corretamente:

```bash
railway service
```

## Atualização da Aplicação

Para atualizar a aplicação já implantada:

1. Faça suas alterações no código
2. Commit e push para o repositório
3. Execute novamente:

```bash
railway up
``` 