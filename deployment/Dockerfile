FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd server && npm install

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Expose ports
EXPOSE 3000 3001

# Create startup script
RUN echo '#!/bin/sh' > start.sh && \
    echo 'npm run server &' >> start.sh && \
    echo 'npx serve -s dist -l 3000' >> start.sh && \
    chmod +x start.sh

# Start the application
CMD ["./start.sh"]