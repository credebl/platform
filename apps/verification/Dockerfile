# Stage 1: Build the application
FROM node:16-alpine as build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./
#COPY package-lock.json ./

# Install dependencies
RUN npm i

# Copy the rest of the application code
COPY . .
CMD ["sh", "-c", "cd libs/prisma-service && npx prisma generate"]

# Build the user service
RUN npm run build verification

# Stage 2: Create the final image
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy the compiled code from the build stage
COPY --from=build /app/dist/apps/verification/ ./dist/apps/verification/

# Copy the libs folder from the build stage
COPY --from=build /app/libs/ ./libs/
#COPY --from=build /app/package.json ./  
COPY --from=build /app/node_modules  ./node_modules

# Install production dependencies for the final image
#RUN npm i --only=production

# Set the command to run the microservice
CMD ["sh", "-c", "cd libs/prisma-service && npx prisma generate && cd ../.. && node dist/apps/verification/main.js"]

# docker build -t verification -f apps/verification/Dockerfile .
# docker run -d --env-file .env --name verification docker.io/library/verification
# docker logs -f verification
