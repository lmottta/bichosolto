# Este arquivo é usado como ponto de entrada para Railway
# O Railway usa a variável de ambiente SERVICE para determinar qual serviço implantar

# Usar a imagem oficial do Node.js como base
FROM node:18-alpine

# Usar argumentos para definir o serviço a ser implantado (padrão: backend)
ARG SERVICE=backend
ENV SERVICE=${SERVICE}

# Definir o diretório de trabalho
WORKDIR /app

# Copiar os arquivos específicos do serviço com base na variável SERVICE
COPY . .

# Executar comandos específicos com base no serviço
RUN if [ "$SERVICE" = "backend" ]; then \
      echo "Configurando o serviço de backend..." && \
      cd backend && \
      npm ci --only=production && \
      mkdir -p uploads/profiles uploads/animals uploads/events uploads/reports; \
    elif [ "$SERVICE" = "frontend" ]; then \
      echo "Configurando o serviço de frontend..." && \
      cd frontend && \
      npm ci && \
      npm run build; \
    else \
      echo "Serviço não reconhecido: $SERVICE" && \
      exit 1; \
    fi

# Expor a porta com base no serviço
EXPOSE $PORT

# Definir o comando de inicialização com base no serviço
CMD if [ "$SERVICE" = "backend" ]; then \
      cd backend && npm start; \
    elif [ "$SERVICE" = "frontend" ]; then \
      cd frontend && npx serve -s dist -l $PORT; \
    else \
      echo "Serviço não reconhecido: $SERVICE" && \
      exit 1; \
    fi 