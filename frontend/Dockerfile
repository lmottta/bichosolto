FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de configuração do npm
COPY package*.json ./

# Instalar dependências 
RUN npm install

# Copiar o restante dos arquivos do projeto
COPY . .

# Construir a aplicação para produção
RUN npm run build

# Segunda etapa: servir a aplicação com servidor estático
FROM node:18-alpine

WORKDIR /app

# Instalar serve para servir conteúdo estático
RUN npm install -g serve

# Copiar os arquivos de build da etapa anterior
COPY --from=builder /app/dist /app/dist

# Expor a porta que o servidor vai usar
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["serve", "-s", "dist", "-l", "3000"] 