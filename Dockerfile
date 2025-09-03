# Stage 1: Build React app
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

# Declare all expected ARGs
ARG BASE_URL

# Clean up old builds
RUN rm -rf dist/*

# Create the .env file dynamically from the ARGs
RUN echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" > .env

RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve with lightweight server
FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve
COPY --from=build /app/dist ./build


EXPOSE 3000
CMD ["serve", "-s", "build"]
