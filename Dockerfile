# ---- Stage 1: Build the app ----
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# ---- Stage 2: Run the app ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# The port Render will expose
ENV PORT=8080
EXPOSE 8080

# Render injects DATABASE_URL automatically
ENTRYPOINT ["java", "-jar", "app.jar"]
