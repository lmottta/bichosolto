# Deployment do Frontend no Railway

Este documento contém instruções para o deployment do frontend do projeto Bicho Solto no Railway.

## Configuração do Projeto

### Estrutura de Arquivos

Os seguintes arquivos foram configurados para o deployment no Railway:

- `.railway.toml` - Configuração do Railway para build e deploy
- `Dockerfile.railway` - Dockerfile otimizado para o ambiente Railway
- `.env.production` - Variáveis de ambiente para produção
- `package.json` - Scripts adicionados para suporte ao Railway

### Variáveis de Ambiente

As seguintes variáveis de ambiente são necessárias:

| Variável | Descrição | Valor para Produção |
|----------|-----------|---------------------|
| NODE_ENV | Ambiente de execução | production |
| PORT | Porta onde o serviço será executado | 3000 |
| VITE_API_URL | URL da API de backend | https://bichosolto-production.up.railway.app |
| VITE_APP_ENV | Ambiente da aplicação | production |
| VITE_APP_TITLE | Título da aplicação | Bicho Solto |

## Processo de Deployment

1. Certifique-se de que o repositório está conectado ao Railway
2. Configure o Root Directory como `/frontend` nas configurações do serviço
3. Adicione as variáveis de ambiente listadas acima
4. O Railway automaticamente usará o `.railway.toml` para configurar o build e deploy

## Diagnóstico

Em caso de problemas, execute:

```
railway run -s bicho_solto_frontend -- npm run diagnose
```

Este comando executará o script de diagnóstico que verificará o ambiente Railway.

## Reiniciar o Deployment

Para forçar um novo deployment:

1. Vá para a seção "Deployments" do serviço no Railway
2. Clique em "Deploy" no canto superior direito
3. Acompanhe os logs para verificar o progresso

## Logs e Monitoramento

Os logs do serviço podem ser acessados pela interface do Railway, na aba "Logs".

Para monitoramento em tempo real e métricas, use a aba "Metrics" no dashboard do serviço. 