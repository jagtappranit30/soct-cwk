# =====================================================================
# Stage 1: Build the Spring Boot backend
# =====================================================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build

WORKDIR /app

# Copy Maven config first (lets Docker cache the dependency download layer)
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and build the JAR (skip tests for faster CI builds)
COPY src ./src
RUN mvn clean package -DskipTests -q

# =====================================================================
# Stage 2: Run-only image — only the JRE and the JAR
# =====================================================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the built JAR from Stage 1
COPY --from=build /app/target/notts-events-0.0.1-SNAPSHOT.jar app.jar

# Expose the Spring Boot port
EXPOSE 8080

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]
