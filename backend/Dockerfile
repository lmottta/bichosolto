FROM node:18-alpine

WORKDIR /app

# Instalar dependências
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Criar diretório de uploads se não existir
RUN mkdir -p uploads/profiles uploads/events uploads/reports uploads/animals

# Expor porta
EXPOSE 5000

# Comando para iniciar o servidor em modo produção
CMD ["npm", "start"] 