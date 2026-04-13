#!/bin/bash
# Script to bootstrap LocalStack for CDK deployment

echo "🚀 Bootstrapping CDK on LocalStack..."

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
    echo "❌ LocalStack is not running!"
    echo "Please start LocalStack first:"
    echo "  docker-compose up -d"
    echo "  OR"
    echo "  npm run localstack:start"
    exit 1
fi

echo "✅ LocalStack is running"

# Set LocalStack environment variables
export AWS_DEFAULT_REGION=us-east-1
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export CDK_DEFAULT_ACCOUNT=000000000000
export CDK_DEFAULT_REGION=us-east-1

# Bootstrap CDK
echo "📦 Bootstrapping CDK..."
cdklocal bootstrap aws://000000000000/us-east-1

echo "✅ Bootstrap complete!"
echo ""
echo "You can now deploy with:"
echo "  npm run deploy:local"
