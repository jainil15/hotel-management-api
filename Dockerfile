FROM node:22
WORKDIR /app
COPY package*.json ./
RUN apt-get update -y
RUN apt-get install python3 -y
RUN npm install
COPY . .
CMD ["node", "index.js"]