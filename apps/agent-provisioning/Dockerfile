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
RUN npm run build agent-provisioning


# Base image
FROM 668004263903.dkr.ecr.ap-south-1.amazonaws.com/credebl2.0:agent-provisioning-base-image
RUN rm -rf /app/*
# Set the working directory
WORKDIR /app

RUN mkdir -p ./agent-provisioning/AFJ/endpoints
RUN mkdir -p ./agent-provisioning/AFJ/agent-config

# Copy the compiled code
COPY --from=build /app/node_modules  ./node_modules
COPY --from=build dist/apps/agent-provisioning/ ./dist/apps/agent-provisioning/
COPY --from=build apps/agent-provisioning/AFJ/scripts ./agent-provisioning/AFJ/scripts


RUN chmod +x /app/agent-provisioning/AFJ/scripts/start_agent.sh
RUN chmod +x /app/agent-provisioning/AFJ/scripts/start_agent_ecs.sh
RUN chmod 777 /app/agent-provisioning/AFJ/endpoints
RUN chmod 777 /app/agent-provisioning/AFJ/agent-config

# Copy the libs folder
COPY libs/ ./libs/

# Set the command to run the microservice
CMD ["sh", "-c", "cd libs/prisma-service && npx prisma generate && cd ../.. && node dist/apps/agent-provisioning/main.js"]


# Set the command to run the microservice
#CMD ["node", "dist/apps/user/main.js"]
# EXPOSE 5001
#  docker build -t agent-provisioning-service -f apps/agent-provisioning/Dockerfile .
# docker run -d --env-file .env --name agent-provisioning-service agent-provisioning-service