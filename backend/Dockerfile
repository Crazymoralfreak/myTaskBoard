# Use an official Maven image as the build stage
FROM maven:3.8.6-openjdk-17 AS build
WORKDIR /app

# Copy the pom.xml and source code
COPY pom.xml .
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Use a lightweight JRE image for the runtime stage
FROM openjdk:17-jre-slim
WORKDIR /app

# Copy the built JAR file from the build stage
COPY --from=build /app/target/myTaskBoard-1.0-SNAPSHOT.jar ./app.jar

# Expose the application port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]