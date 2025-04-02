FROM node:18-alpine

WORKDIR /app

# Instalar dependências necessárias para pacotes nativos e PostgreSQL client
RUN apk add --no-cache python3 make g++ postgresql-client

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Criar diretório para uploads se não existir
RUN mkdir -p uploads/profiles uploads/animals uploads/events uploads/reports

# Adicionar script de healthcheck para PostgreSQL
COPY ./healthcheck.sh /healthcheck.sh
RUN chmod +x /healthcheck.sh

# Expor porta
EXPOSE 5000

# Comando para iniciar a aplicação com espera pelo PostgreSQL
CMD ["/bin/sh", "-c", "/healthcheck.sh && npm start"] 