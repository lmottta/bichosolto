FROM node:18-alpine

WORKDIR /app

# Instalar dependências necessárias para pacotes nativos
RUN apk add --no-cache python3 make g++

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Criar diretório para uploads se não existir
RUN mkdir -p uploads/profiles uploads/animals uploads/events uploads/reports

# Expor porta
EXPOSE 5000

# Comando para iniciar a aplicação
CMD ["npm", "start"] 