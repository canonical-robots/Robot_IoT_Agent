# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install your Node.js application's dependencies
RUN npm install

# Copy your application code into the container
COPY . .

# Expose the port your application will run on
EXPOSE 3000

# Define the command to run your Node.js application
CMD ["node", "elfin_adapter.js"]

