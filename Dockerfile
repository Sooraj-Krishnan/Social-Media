# Use the official Node.js image as the base image
FROM node:18-alpine

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install


# Copy the rest of the application code to the container
COPY . .

# Define a build-time argument for the database URL
ARG DATABASE_URL

# Set the environment variable using the build-time argument
ENV MONGODB_URI=$DATABASE_URL


# Expose the port on which the application will run
EXPOSE 3000



# Start the application
CMD ["node", "server.js"]