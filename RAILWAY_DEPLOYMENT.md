# Implantação do Projeto Bicho Solto no Railway

Este guia contém instruções para a implantação correta do frontend do projeto Bicho Solto no Railway.

## Configuração para Deployment

### Importante: Configuração do Root Directory

Para garantir que o Dockerfile funcione corretamente:

1. Acesse o serviço no Railway
2. Vá para **Settings** > **Service**
3. **IMPORTANTE**: Remova qualquer valor definido em **Root Directory** (deixe em branco)
4. Certifique-se de que o builder está definido como "Dockerfile"
5. Clique em "Deploy" para aplicar as mudanças

### Arquivos de Configuração

Os seguintes arquivos foram configurados para o deployment:

- `Dockerfile` (na raiz do projeto): Container para servir o frontend
- `railway.json` (na raiz): Configuração do serviço no Railway
- `.dockerignore`: Otimiza o processo de build

### Variáveis de Ambiente

As seguintes variáveis de ambiente são necessárias para o frontend:

| Variável | Descrição | Valor Exemplo |
|----------|-----------|---------------|
| PORT | Porta para o servidor | 3000 |
| VITE_API_URL | URL da API backend | https://bichosolto-production.up.railway.app |
| VITE_APP_ENV | Ambiente da aplicação | production |
| VITE_APP_TITLE | Título da aplicação | Bicho Solto |
| GENERATE_SOURCEMAP | Gerar sourcemaps | false |

## Solução de Problemas

Se você encontrar erros durante o deployment:

1. Verifique os logs do serviço no Railway
2. Confirme que a configuração de Root Directory foi removida
3. Verifique se as variáveis de ambiente estão configuradas corretamente

O erro mais comum é "package.json not found" que ocorre quando o contexto do Docker não está configurado corretamente. A solução implementada neste projeto resolve esse problema usando um Dockerfile na raiz que copia apenas os arquivos do frontend. 