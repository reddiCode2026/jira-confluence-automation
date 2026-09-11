FROM node:24.21.0-bookworm-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN mkdir -p reports

EXPOSE 3000

CMD ["npm", "start"]
