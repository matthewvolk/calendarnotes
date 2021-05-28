FROM node:14.16.1

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .
COPY .env.production .env

EXPOSE 5000

CMD ["npm", "start"]

USER node