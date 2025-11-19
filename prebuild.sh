#!/bin/bash
echo "🔨 Checking frontend build..."
if [ ! -d "/app/frontend/build" ]; then
    echo "Building frontend..."
    cd /app/frontend && yarn build
    echo "✅ Build completed"
else
    echo "✅ Build exists"
fi
