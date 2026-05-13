# Build desde la raíz del repo (Render: Root Directory vacío, Dockerfile Path=Dockerfile).
# Evita el error backend/backend cuando Root Directory y la ruta del Dockerfile se combinan mal.
# syntax=docker/dockerfile:1
FROM maven:3.9.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY backend/pom.xml .
COPY backend/src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV PORT=8080
EXPOSE 8080
CMD exec sh -c 'java -Dserver.port="${PORT:-8080}" -jar app.jar'
