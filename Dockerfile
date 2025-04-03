FROM node:18-alpine

# Configurar diretório de trabalho
WORKDIR /app

# Copiar apenas os arquivos do frontend
COPY frontend/ .

# Mostrar o conteúdo para diagnóstico
RUN echo "Conteúdo do diretório de trabalho:" && ls -la

# Instalar dependências 
RUN npm install

# Construir a aplicação
RUN npm run build

# Instalar serve para servir o conteúdo estático
RUN npm install -g serve

# Expor porta (usando variável de ambiente ou valor padrão)
EXPOSE ${PORT:-3000}

# Iniciar servidor
CMD ["serve", "-s", "dist", "-l", "${PORT:-3000}"] 