FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install && npm install -g tsx

COPY . .

CMD ["tsx", "src/app.ts"]
