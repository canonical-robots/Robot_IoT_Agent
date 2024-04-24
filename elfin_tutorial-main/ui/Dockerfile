# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of your application code to the working directory
COPY . .

# Expose the port your application will run on
EXPOSE 3003

# Define the command to run your Node.js application
CMD ["node", "elfin_ui_server.js"]

