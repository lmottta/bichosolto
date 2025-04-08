# Animal Rescue Hub

Um aplicativo web focado no resgate e proteção de animais em situação de risco.

## Visão Geral

O Animal Rescue Hub é uma plataforma que permite aos usuários denunciar maus-tratos a animais, disponibilizar animais para adoção, realizar doações, se voluntariar para ações de resgate e divulgar eventos relacionados à causa animal.

## Funcionalidades Principais

### Denúncias de Maus-Tratos
- Formulário para reportar casos com fotos, localização e descrição detalhada
- Sistema de status das denúncias (pendente, em andamento, resolvido)

### Adoção de Animais
- Cadastro de animais disponíveis para adoção
- Filtros de busca por tipo de animal, localização e situação da adoção

### Doações e Financiamento Coletivo
- Doação direta para ONGs cadastradas via Pix, cartão de crédito ou PayPal
- Criação de campanhas de arrecadação para casos específicos

### Cadastro de Voluntários e Transporte Solidário
- Registro de voluntários para resgates, lar temporário ou transporte

### Divulgação de Eventos e Feiras de Adoção
- Publicação de eventos, mutirões de resgate, feiras de adoção e campanhas de vacinação

## Tecnologias Utilizadas

### Frontend
- React
- Tailwind CSS
- DaisyUI

### Backend
- Node.js
- Express

### Banco de Dados
- PostgreSQL

### Autenticação
- JWT (JSON Web Tokens)

### Armazenamento de Arquivos
- Armazenamento local para imagens

### Geolocalização
- Google Maps API

### DevOps e Implantação
- Docker e Docker Compose

## Instalação e Configuração

### Método 1: Instalação Tradicional

#### Pré-requisitos
- Node.js (v14 ou superior)
- npm ou yarn
- PostgreSQL

#### Configuração do Ambiente

1. Clone o repositório
```bash
git clone [url-do-repositorio]
cd animal-rescue-hub
```

2. Instale as dependências do frontend
```bash
cd frontend
npm install
```

3. Instale as dependências do backend
```bash
cd ../backend
npm install
```

4. Configure o banco de dados PostgreSQL

5. Configure as variáveis de ambiente
```bash
# Crie um arquivo .env na raiz do frontend e backend baseados nos arquivos .env.example
cp .env.example frontend/.env
cp .env.example backend/.env
# Edite os arquivos com suas configurações
```

6. Inicie o servidor de desenvolvimento
```bash
# No diretório backend
npm run dev

# Em outro terminal, no diretório frontend
npm run dev
```

### Método 2: Usando Docker (Recomendado)

#### Pré-requisitos
- Docker e Docker Compose

#### Configuração do Ambiente com Docker

1. Clone o repositório
```bash
git clone [url-do-repositorio]
cd animal-rescue-hub
```

2. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite o arquivo .env conforme necessário
```

3. Inicie os contêineres com Docker Compose

**Para Linux/Mac**:
```bash
docker-compose up -d
```

**Para Windows**:
* **Usando o script interativo**:
  ```
  run-docker.bat
  ```
  Selecione a opção 1 no menu interativo para iniciar o ambiente.

* **Usando o script direto**:
  ```
  start-docker.bat
  ```

4. Acesse o aplicativo
```
Frontend: http://localhost:3000
Backend API: http://localhost:5000
PgAdmin: http://localhost:8080 (email: admin@bischosolto.com, senha: admin)
```

5. Para parar os contêineres

**Para Linux/Mac**:
```bash
docker-compose down
```

**Para Windows**:
* **Usando o script interativo**:
  ```
  run-docker.bat
  ```
  Selecione a opção 2 no menu interativo para parar o ambiente.

* **Usando o script direto**:
  ```
  stop-docker.bat
  ```

### Solução de Problemas

**Problemas no Windows com o Git Bash**:
Se estiver usando Git Bash no Windows e enfrentando problemas com os caminhos dos volumes, use o parâmetro `MSYS_NO_PATHCONV=1`:

```bash
MSYS_NO_PATHCONV=1 docker-compose up -d
```

**Docker Desktop não inicia automaticamente**:
Certifique-se de que o Docker Desktop está instalado e funcionando. Às vezes, o Docker Desktop pode precisar ser iniciado manualmente como administrador.

## Estrutura do Projeto

```
animal-rescue-hub/
├── frontend/           # Aplicação React
│   ├── public/         # Arquivos estáticos
│   └── src/            # Código fonte do frontend
│       ├── components/ # Componentes React
│       ├── pages/      # Páginas da aplicação
│       ├── services/   # Serviços e APIs
│       └── styles/     # Estilos CSS
├── backend/            # API Node.js/Express
│   ├── config/         # Configurações
│   ├── controllers/    # Controladores
│   ├── models/         # Modelos de dados
│   ├── routes/         # Rotas da API
│   ├── middlewares/    # Middlewares
│   └── utils/          # Utilitários
├── docker-compose.yml  # Configuração Docker para desenvolvimento
├── run-docker.bat      # Script interativo para Windows
├── start-docker.bat    # Script para iniciar containers no Windows
├── stop-docker.bat     # Script para parar containers no Windows
└── .env.example        # Exemplo de variáveis de ambiente
```

## Licença

Este projeto está licenciado sob a licença MIT.