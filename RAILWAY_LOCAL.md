# Ambiente Simulado do Railway - Bicho Solto

Este ambiente foi criado para simular localmente a configuração do Railway utilizada em produção. Isso permite testar o aplicativo em um ambiente muito similar ao de produção antes de fazer o deploy no Railway.

## Requisitos

- Docker e Docker Compose instalados
- Git

## Estrutura

O ambiente simulado é composto por:

- **Frontend**: Conteinerizado usando a mesma configuração do Railway
- **Backend**: Conteinerizado usando a mesma configuração do Railway
- **Banco de Dados PostgreSQL**: Simulando o banco de dados de produção
- **Variáveis de ambiente**: Configuradas para espelhar o ambiente de produção

## Arquivos Principais

- `docker-compose.railway-local.yml`: Configuração Docker Compose para o ambiente simulado
- `run-railway-local.sh`: Script para Linux/Mac para gerenciar o ambiente
- `run-railway-local.bat`: Script para Windows para gerenciar o ambiente
- `.env.railway-local`: Variáveis de ambiente para o ambiente simulado

## Como Usar

### Iniciando o Ambiente

#### No Windows

```bash
run-railway-local.bat start
```

Ou abra o arquivo `run-railway-local.bat` sem argumentos para acessar o menu interativo:

```bash
run-railway-local.bat
```

#### No Linux/Mac

```bash
chmod +x run-railway-local.sh  # Torne o script executável (apenas na primeira vez)
./run-railway-local.sh start
```

Ou abra o arquivo `run-railway-local.sh` sem argumentos para acessar o menu interativo:

```bash
./run-railway-local.sh
```

### Parando o Ambiente

#### No Windows

```bash
run-railway-local.bat stop
```

#### No Linux/Mac

```bash
./run-railway-local.sh stop
```

### Visualizando os Logs

#### No Windows

```bash
run-railway-local.bat logs
```

#### No Linux/Mac

```bash
./run-railway-local.sh logs
```

## Acessando a Aplicação

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001

## Verificando o Status

Para verificar o status dos contêineres em execução, use a opção 7 no menu interativo ou execute:

```bash
docker-compose -f docker-compose.railway-local.yml ps
```

## Diferenças em Relação ao Ambiente de Produção

Embora o ambiente simulado seja muito similar ao de produção, existem algumas diferenças:

1. URLs locais em vez de URLs de produção.
2. Banco de dados local em vez do banco de dados gerenciado do Railway.
3. Ausência de CDN ou outros serviços externos que podem estar presentes na produção.

## Solução de Problemas

### Erro de Porta em Uso

Se você receber um erro indicando que a porta 3000 ou 5001 já está em uso, você pode:

1. Parar o serviço que está usando essa porta, ou
2. Modificar as portas no arquivo `docker-compose.railway-local.yml`

### Erro no Banco de Dados

Se ocorrerem erros relacionados ao banco de dados, você pode reiniciar o ambiente com um banco de dados limpo:

```bash
docker-compose -f docker-compose.railway-local.yml down -v
docker-compose -f docker-compose.railway-local.yml up -d
```

### Outros Erros

Se ocorrerem outros erros, verifique os logs para diagnóstico:

```bash
docker-compose -f docker-compose.railway-local.yml logs
```

## Dados de Teste

O ambiente simulado não vem pré-carregado com dados. Para criar dados de teste, você precisará registrar usuários e adicionar outros dados manualmente. 