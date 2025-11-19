#!/bin/bash

# Check if build directory exists
if [ ! -d "/app/frontend/build" ]; then
    echo "🔨 Build directory not found. Building frontend..."
    cd /app/frontend
    yarn build
    echo "✅ Frontend build completed"
else
    echo "✅ Build directory exists, skipping build"
fi

# Start the serve command
cd /app/frontend
exec npx serve -s build -l 3000
