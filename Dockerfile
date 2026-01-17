# MediQueueAI - Multi-stage Docker build

# Backend stage
FROM node:20-slim AS backend
WORKDIR /app/backend
RUN npm install -g bun
COPY backend/package.json backend/bun.lockb* ./
RUN bun install --frozen-lockfile || bun install
COPY backend/ .

# Frontend stage
FROM node:20-slim AS frontend
WORKDIR /app/frontend
RUN npm install -g bun
COPY frontend/package.json frontend/bun.lockb* ./
RUN bun install --frozen-lockfile || bun install
COPY frontend/ .
ENV NODE_ENV=production
RUN bun run build

# Final stage
FROM node:20-slim
WORKDIR /app

# Install Python3, curl, bun and other dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    sqlite3 \
    && npm install -g bun serve \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy backend source and install deps
COPY --from=backend /app/backend ./backend

# Re-install backend dependencies in final stage
WORKDIR /app/backend
RUN bun install --frozen-lockfile || bun install
WORKDIR /app

# Copy built frontend
COPY --from=frontend /app/frontend/build ./frontend/build

# Copy ML files
COPY ml/ ./ml/

# Install Python dependencies for ML
RUN pip3 install --no-cache-dir --break-system-packages -r ml/requirements.txt || true

# Copy database migrations and seeds
COPY database/ ./database/

# Create necessary directories
RUN mkdir -p uploads database ml/models

# Expose ports
EXPOSE 5000 3000

# Environment variables
ENV NODE_ENV=production
ENV DB_PATH=/app/database/queue.db

# Create startup script
RUN echo '#!/bin/sh\n\
echo "Starting MediQueueAI..."\n\
echo "Initializing database..."\n\
cd /app/backend && bun run src/app.ts &\n\
BACKEND_PID=$!\n\
echo "Backend started on port 5000"\n\
sleep 2\n\
echo "Starting frontend on port 3000..."\n\
serve -s /app/frontend/build -l 3000 &\n\
FRONTEND_PID=$!\n\
echo "MediQueueAI is ready!"\n\
echo "- Frontend: http://localhost:3000"\n\
echo "- Backend API: http://localhost:5000/api"\n\
wait $BACKEND_PID $FRONTEND_PID\n\
' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]