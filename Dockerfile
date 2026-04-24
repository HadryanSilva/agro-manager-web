# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# Copia apenas os arquivos de dependências primeiro para cache eficiente
COPY package.json package-lock.json ./
RUN npm ci --quiet

# Recebe a URL base da API como argumento de build
# Em produção, o Nginx faz o proxy de /api → backend, então usamos /api
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# ── Stage 2: Serve ─────────────────────────────────────────────────────────────
FROM nginx:alpine

# Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a configuração customizada com SPA routing e proxy para o backend
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copia os assets gerados pelo Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]