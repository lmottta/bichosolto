# Guia de Implantação Manual no Railway

Se você estiver enfrentando problemas com os scripts automatizados, siga estas instruções passo a passo para implantar manualmente o projeto no Railway.

## Requisitos

1. Node.js instalado
2. Terminal ou PowerShell

## Passo 1: Instalar a CLI do Railway

Abra um terminal ou PowerShell e execute:

```
npm install -g @railway/cli
```

## Passo 2: Fazer login no Railway

```
railway login
```

Será aberta uma janela do navegador para você autorizar o acesso.

## Passo 3: Listar seus projetos

```
railway list
```

## Passo 4: Criar um novo projeto ou usar um existente

Para criar um novo projeto:
```
railway project create BichoSolto
```

Para usar um projeto existente, copie o ID do projeto da lista e execute:
```
railway link a84096bf-1a6c-41b4-bf86-527b8a12ef64
```

## Passo 5: Configurar as variáveis de ambiente

Execute os seguintes comandos um por um:

```
railway variables set DB_HOST=monorail.proxy.rlwy.net
railway variables set DB_PORT=48704
railway variables set DB_NAME=railway
railway variables set DB_USER=postgres
railway variables set DB_PASSWORD=trHjXCnIPMLvaSVddPKwNxGGMgjUUhbh
railway variables set JWT_SECRET=Yhsjdshdiuwew12@
railway variables set JWT_EXPIRES_IN=7d
railway variables set API_URL=https://bichosolto-production.up.railway.app
railway variables set PORT=3000
railway variables set NODE_ENV=production
railway variables set GOOGLE_MAPS_API_KEY=AIzaSyC7_3XFwXiqZRICVjloOfO9u-hGD1Ei31k
railway variables set EMAIL_HOST=smtp.gmail.com
railway variables set EMAIL_PORT=587
railway variables set EMAIL_USER=dev.lamota@gmail.com
```

Para a senha do e-mail, substitua `<SUA_SENHA>` pela senha real:
```
railway variables set EMAIL_PASSWORD=<SUA_SENHA>
```

## Passo 6: Iniciar a implantação

```
railway up
```

Este comando pode levar alguns minutos para concluir, pois irá construir e implantar a aplicação.

## Passo 7: Verificar o status e obter a URL

```
railway service
```

## Passo 8: Abrir a aplicação no navegador

```
railway open
```

## Solução de problemas comuns

### 1. Erro de permissão ao executar comandos

No Windows, tente executar o PowerShell como administrador e então executar os comandos.

### 2. CLI do Railway não encontrado após instalação

Reinicie seu terminal/PowerShell ou reinicie seu computador e tente novamente.

### 3. Falha na implantação

Verifique os logs para obter mais detalhes:
```
railway logs
```

### 4. Problemas com o Docker Compose

Se o Railway estiver tendo problemas para usar o docker-compose.railway.yml, você pode implantar diretamente os serviços:

Para o backend:
```
cd backend
railway up
```

Para o frontend:
```
cd frontend
railway up
```

### 5. Verificar conexão com o banco de dados

Após a implantação, acesse:
```
https://[URL_DA_APLICACAO]/api/diagnostico
```

### 6. Persistência de dados

Se precisar garantir que os uploads sejam persistidos, configure um volume no Railway através do painel de controle. 