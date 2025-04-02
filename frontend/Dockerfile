# Estágio de build
FROM node:18-alpine AS build

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Criar arquivo .env se não existir
RUN touch .env

# Construir a aplicação
RUN npm run build

# Estágio de produção - Nginx para servir conteúdo estático
FROM nginx:alpine

# Copiar a build do estágio anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuração personalizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

# Comandos para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"] 