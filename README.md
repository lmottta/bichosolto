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

## Instalação e Configuração

### Pré-requisitos
- Node.js (v14 ou superior)
- npm ou yarn
- PostgreSQL

### Configuração do Ambiente

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

6. Inicie o servidor de desenvolvimento
```bash
# No diretório backend
npm run dev

# Em outro terminal, no diretório frontend
npm run dev
```

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
└── backend/           # API Node.js/Express
    ├── config/        # Configurações
    ├── controllers/   # Controladores
    ├── models/        # Modelos de dados
    ├── routes/        # Rotas da API
    ├── middlewares/   # Middlewares
    └── utils/         # Utilitários
```

## Licença

Este projeto está licenciado sob a licença MIT.