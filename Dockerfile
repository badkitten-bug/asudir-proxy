# Usa una imagen oficial de Node.js como base
FROM node:18-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias (solo producción)
RUN npm install --production

# Copia el resto del código fuente
COPY . .

# Expone el puerto por defecto de NestJS (ajusta si usas otro)
EXPOSE 4000

# Comando para iniciar la app en modo producción
CMD ["npm", "run", "start:prod"] 