FROM node:18-alpine

WORKDIR /app

# Instalar dependências - primeiro copiamos apenas package.json e package-lock.json
# para aproveitar o cache de camadas do Docker
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Criar diretório de uploads se não existir e ajustar permissões
RUN mkdir -p uploads/profiles uploads/events uploads/reports uploads/animals && \
    chmod -R 777 uploads

# Expor porta
EXPOSE 5000

# Verificação de saúde
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

# Comando para iniciar o servidor em modo produção
CMD ["node", "src/server.js"] 