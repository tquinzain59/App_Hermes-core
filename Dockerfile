# Image Nginx Alpine légère pour servir l'application Web/PWA Hermès Core
FROM nginx:alpine

LABEL maintainer="Thibaut"
LABEL version="1.0-app-hermes-core"

# Copie des fichiers statiques de l'application
COPY . /usr/share/nginx/html/

# Expose le port HTTP standard du conteneur
EXPOSE 80

# Démarre Nginx en avant-plan
CMD ["nginx", "-g", "daemon off;"]
