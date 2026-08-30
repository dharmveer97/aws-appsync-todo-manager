#!/bin/bash

# Floki Setup Script for AWS AppSync Todo Manager

echo "Setting up Floki for AWS AppSync Todo Manager..."
echo

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose is not installed or not accessible."
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker Desktop or Docker service."
    exit 1
fi

echo "✅ Docker is installed and running"

# Start Floki
echo
echo "🚀 Starting Floki..."
docker compose up -d

echo "⏳ Waiting for Floki to start (give it 30 seconds)..."
sleep 30

# Set environment variables for local development
echo
echo "⚙️  Setting up environment variables..."
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_DEFAULT_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export USE_LOCALSTACK=true

echo "✅ Environment variables set"

# Install project dependencies if needed
echo
echo "📦 Installing project dependencies..."
npm install
npm run build

echo
echo "🎉 Setup complete!"
echo
echo "Next steps:"
echo "1. Deploy the CDK stack: npm run deploy:local"
echo "2. Set up frontend: cd frontend && npm install && cp .env.example .env"
echo "3. Update frontend/.env with API URL and Key from deployment output"
echo "4. Seed database: npm run seed"
echo "5. Start frontend: npm run dev"
echo
echo "To stop Floki: docker compose down"