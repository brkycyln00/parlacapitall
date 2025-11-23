#!/bin/bash
set -e

echo "🚀 Frontend Startup Script"
echo "=========================="

cd /app/frontend

# Check if build directory exists and has index.html
if [ ! -f "build/index.html" ]; then
    echo "⚠️  Build directory empty or missing index.html!"
    echo "🔨 Building frontend..."
    yarn build
    echo "✅ Build completed!"
else
    echo "✅ Build directory exists and ready"
fi

# Start the server
echo "🌐 Starting frontend server on port 3000..."
exec npx serve -s build -l 3000
