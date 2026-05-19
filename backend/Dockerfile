FROM node:22-alpine AS dev

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

EXPOSE 3000

CMD ["npm", "run", "dev"]


FROM node:22-alpine AS prod

WORKDIR /app

COPY shared/ ./shared/

COPY frontend/src/constants/ ./frontend/src/constants/

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

RUN npm ci --omit=dev

EXPOSE 3000

CMD ["npm", "start"]
