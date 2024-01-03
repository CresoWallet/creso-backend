# Stage 1 - build the application
FROM node:18 AS build
WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/
RUN npm install
COPY . .
RUN npm run build

# Stage 2 - create the final image
FROM node:18-alpine
WORKDIR /usr/src/app

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma/
COPY package*.json ./
COPY .env.example ./
COPY .env ./
ENV NODE_ENV=production
RUN npm install --only=production
RUN npx prisma generate
EXPOSE 8080

CMD ["node", "dist/index.js"]