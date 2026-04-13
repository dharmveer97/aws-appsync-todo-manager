#!/bin/bash
# Example Development Workflow
# This script shows the typical development cycle

set -e

echo "🚀 Local Development Workflow Example"
echo "======================================"
echo ""

# Step 1: Check LocalStack is running
echo "Step 1: Checking LocalStack..."
if ! curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
    echo "❌ LocalStack is not running!"
    echo "Starting LocalStack..."
    docker-compose up -d
    echo "⏳ Waiting for LocalStack to be ready (30 seconds)..."
    sleep 30
fi
echo "✅ LocalStack is running"
echo ""

# Step 2: Build TypeScript code
echo "Step 2: Building TypeScript code..."
npm run build
echo "✅ Build complete"
echo ""

# Step 3: Deploy to LocalStack
echo "Step 3: Deploying to LocalStack..."
echo "This will:"
echo "  - Create DynamoDB tables"
echo "  - Deploy AppSync API"
echo "  - Configure resolvers"
echo ""
npm run deploy:local
echo "✅ Deployment complete"
echo ""

# Step 4: Show next steps
echo "Step 4: Test your API!"
echo ""
echo "📝 API Outputs saved in CDK outputs"
echo ""
echo "🧪 Testing options:"
echo ""
echo "1. GraphQL Playground:"
echo "   http://localhost:4566/_aws/appsync/graphiql"
echo ""
echo "2. curl commands:"
echo "   API_URL=<your-api-url>"
echo "   API_KEY=<your-api-key>"
echo ""
echo "   # Create Todo"
echo "   curl -X POST \"\$API_URL\" \\"
echo "     -H \"x-api-key: \$API_KEY\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"query\":\"mutation { createTodo(input: {title: \\\"Test\\\", completed: false}) { id title } }\"}'"
echo ""
echo "3. Use test script:"
echo "   ./scripts/test-api.sh <API_URL> <API_KEY>"
echo ""
echo "✅ Development environment ready!"
echo ""
echo "💡 Quick Commands:"
echo "   npm run build          # Rebuild after changes"
echo "   npm run deploy:local   # Redeploy to LocalStack"
echo "   npm run destroy:local  # Remove stack"
echo "   docker-compose logs -f # View LocalStack logs"
