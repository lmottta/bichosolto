FROM node:18-alpine as builder

WORKDIR /app

# Instalar dependências
COPY package.json package-lock.json ./
RUN npm ci

# Copiar código fonte
COPY . .

# Construir aplicação
RUN npm run build

# Imagem final com Nginx para servir os arquivos estáticos
FROM nginx:alpine

# Copiar configuração do nginx
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Copiar os arquivos de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Expor porta
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"] 