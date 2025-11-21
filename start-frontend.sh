#!/bin/bash
set -e

echo "🚀 Frontend Startup Script"
echo "=========================="

cd /app/frontend

# Check if build directory exists
if [ ! -d "build" ]; then
    echo "⚠️  Build directory not found!"
    echo "🔨 Building frontend..."
    yarn build
    echo "✅ Build completed!"
else
    echo "✅ Build directory exists"
fi

# Start the server
echo "🌐 Starting frontend server on port 3000..."
exec npx serve -s build -l 3000
