FROM mhart/alpine-node:11.3.0
WORKDIR /src
COPY package.json ./
RUN npm i
COPY index.js test.js ./
RUN npm run test
