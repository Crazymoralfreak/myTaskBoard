# Use an official Maven image as the build stage
FROM maven:3.8.3-openjdk-17 AS build
WORKDIR /app

# Copy the pom.xml and source code
COPY pom.xml .
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Use a lightweight JRE image for the runtime stage
FROM openjdk:17-oracle
WORKDIR /app

# Copy the built JAR file from the build stage
COPY --from=build app/target/myTaskBoard-1.0-SNAPSHOT.jar ./app.jar

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Add environment variables
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# Expose the application port
EXPOSE 8080

# Run the application
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar app.jar"]