FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Cài đặt một static server và chạy thư mục dist trên port 5173
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "5173"]