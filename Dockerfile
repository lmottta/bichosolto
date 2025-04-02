# Este arquivo é usado como ponto de entrada para Railway
# O Railway usa a variável de ambiente SERVICE para determinar qual serviço implantar

# Estágio para determinar o serviço
FROM alpine as detector
ARG SERVICE=backend
RUN echo "Deploying service: $SERVICE"

# Se o serviço for frontend, use o Dockerfile do frontend
FROM bichosolto-frontend as frontend-image
COPY --from=detector /dev/null /dev/null

# Se o serviço for backend, use o Dockerfile do backend
FROM bichosolto-backend as backend-image
COPY --from=detector /dev/null /dev/null

# Estágio final com base na variável SERVICE
FROM ${SERVICE}-image 