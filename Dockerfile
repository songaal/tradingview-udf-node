FROM node:12.0
WORKDIR /usr/src/binance
COPY package.json package-lock.json ./
RUN npm install
COPY src ./
EXPOSE 80
CMD ["node", "binance.jse.js"]
