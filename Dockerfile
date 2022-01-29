FROM node:17-bullseye
RUN apt-get update
# https://askubuntu.com/questions/519082/how-to-install-libre-office-without-gui#comment705248_519091
RUN apt-get install -y libreoffice
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "index.js"]