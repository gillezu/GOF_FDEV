# Base image for client
FROM node:18 AS client-build

# Set working directory for client
WORKDIR /app/client

# Copy client code
COPY client/package.json client/package-lock.json ./
RUN npm install

# Copy the rest of the client code
COPY client ./

# Base image for server
FROM python:3.10 AS server-build

# Set working directory for server
WORKDIR /app/server

# Copy server code
COPY server /app/server
COPY requirements.txt /app/server/requirements.txt

# Install Python dependencies
RUN pip install --upgrade pip  # Upgrade pip to latest version
RUN pip install --no-cache-dir -r /app/server/requirements.txt && pip freeze

# Final image
FROM python:3.10

# Set working directory
WORKDIR /app

# Install Node.js and npm in the final image
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Upgrade pip in the final image
RUN pip install --upgrade pip

# Copy server files
COPY --from=server-build /app/server /app/server

# Copy client files for dev
COPY --from=client-build /app/client /app/client

# Install additional tools for running multiple processes
RUN npm install -g concurrently

# Expose ports for both server and client
EXPOSE 8000 5173

# Command to run both the Python server and React client
CMD ["concurrently", "\"npm --prefix /app/client run dev\"", "\"python /app/server/app/server.py\""]