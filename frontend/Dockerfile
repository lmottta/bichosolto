FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Verificar diretório atual (para diagnóstico)
RUN ls -la /

# Copiar arquivos de configuração do npm
COPY package*.json ./

# Verificar se os arquivos foram copiados
RUN ls -la /app && echo "Package.json copiado com sucesso"

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
EXPOSE ${PORT:-3000}

# Mostrar diretório para diagnóstico
RUN ls -la /app

# Comando para iniciar o servidor
CMD ["serve", "-s", "dist", "-l", "${PORT:-3000}"] 