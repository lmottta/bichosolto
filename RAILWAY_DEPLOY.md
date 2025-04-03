# Deploy do Bicho Solto no Railway

Este documento contém instruções para realizar o deploy da aplicação Bicho Solto no Railway.

## Pré-requisitos

1. Conta no [Railway](https://railway.app/)
2. [Railway CLI](https://docs.railway.app/develop/cli) instalado (opcional, para deploy via CLI)

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente no Railway:

| Variável | Descrição | Valor Recomendado |
|----------|-----------|-------------------|
| `NODE_ENV` | Ambiente de execução | `production` |
| `PORT` | Porta que o servidor irá utilizar | `5000` |
| `VITE_API_URL` | URL da API para o frontend | `/api` |
| `CORS_ORIGIN` | Origem permitida para CORS | URL do seu app no Railway |
| `JWT_SECRET` | Chave secreta para tokens JWT | Uma string segura e aleatória |
| `JWT_EXPIRES_IN` | Tempo de expiração dos tokens | `7d` |
| `DB_SYNC` | Sincronizar modelos com o banco | `true` (apenas na primeira vez) |

## Configuração do Banco de Dados

O Railway fornecerá automaticamente as seguintes variáveis quando você adicionar um PostgreSQL ao seu projeto:

- `DATABASE_URL`
- `PGHOST`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`
- `PGPORT`

Não é necessário configurá-las manualmente.

## Passos para Deploy

### Via Interface Web

1. Acesse o [Railway](https://railway.app/)
2. Crie um novo projeto
3. Adicione um serviço do tipo "GitHub Repo"
4. Selecione o repositório do Bicho Solto
5. Adicione um serviço do tipo "Database" e escolha "PostgreSQL"
6. Configure as variáveis de ambiente listadas acima
7. Aguarde o deploy ser concluído

### Via CLI

```bash
# Login no Railway
railway login

# Inicializar o projeto
railway init

# Adicionar o banco de dados PostgreSQL
railway add

# Configurar variáveis de ambiente
railway vars set NODE_ENV=production PORT=5000 VITE_API_URL=/api ...

# Realizar o deploy
railway up
```

## Verificação do Deploy

Após o deploy, acesse a URL fornecida pelo Railway para verificar se a aplicação está funcionando corretamente.

## Problemas Comuns

1. **Erro 502 Bad Gateway**:
   - Verifique os logs do serviço
   - Certifique-se de que o banco de dados está conectado corretamente
   - Confirme que todas as variáveis de ambiente estão configuradas

2. **Problemas com CORS**:
   - Verifique se `CORS_ORIGIN` está configurado corretamente

3. **Falha na conexão com o banco de dados**:
   - Verifique se o PostgreSQL está ativo
   - Confirme que as credenciais estão corretas

## Atualizações

Para atualizar a aplicação após modificações no código:

1. Commit e push das alterações para o GitHub
2. O Railway detectará automaticamente as mudanças e realizará um novo deploy 