# Quick Start Guide

Get your AWS AppSync API running locally with LocalStack in minutes!

## Prerequisites Check

```bash
# Check Node.js (need 18+)
node --version

# Check Docker
docker --version

# Check if AWS CLI is configured
aws configure list
```

## Step 1: Install LocalStack Tools

```bash
# Install LocalStack
pip install localstack

# Install awscli-local (provides cdklocal command)
pip install awscli-local[ver1]
```

## Step 2: Start LocalStack

```bash
# Start LocalStack with Docker Compose (recommended)
docker-compose up -d

# Wait a few seconds for LocalStack to be ready
sleep 10

# Verify LocalStack is running
curl http://localhost:4566/_localstack/health
```

## Step 3: Bootstrap CDK

```bash
# Use the bootstrap script
./scripts/localstack-bootstrap.sh

# OR manually:
cdklocal bootstrap aws://000000000000/us-east-1
```

## Step 4: Deploy Your API

```bash
# Build TypeScript
npm run build

# Deploy to LocalStack
npm run deploy:local

# Save the outputs - you'll need the API URL and API Key!
```

## Step 5: Test Your API

The deployment will output:

- -

### Option A: Use GraphQL Playground

Access the playground at:

```
http://localhost:4566/_aws/appsync/graphiql?apiId=YOUR_API_ID
```

### Option B: Use the Test Script

```bash
# Make the script executable
chmod +x scripts/test-api.sh

# Run tests (replace with your actual values)
./scripts/test-api.sh \
  "YOUR_API_URL" \
  "YOUR_API_KEY"
```

### Option C: Use curl

```bash
# Set your API details
API_URL="YOUR_API_URL"
API_KEY="YOUR_API_KEY"

# Create a Todo
curl -X POST "$API_URL" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createTodo(input: { title: \"My First Todo\", description: \"Learn AppSync\", completed: false }) { id title description completed } }"
  }'

# List all Todos
curl -X POST "$API_URL" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { listTodos { items { id title description completed } } }"
  }'
```

## Common Commands

```bash
# See all available commands
npm run

# Rebuild after making changes
npm run build

# Redeploy
npm run deploy:local

# Destroy the stack
npm run destroy:local

# View LocalStack logs
docker-compose logs -f

# Stop LocalStack
docker-compose down
```

## Troubleshooting

### LocalStack not responding

```bash
# Restart LocalStack
docker-compose down
docker-compose up -d
sleep 10
```

### CDK bootstrap fails

```bash
# Make sure LocalStack is running
curl http://localhost:4566/_localstack/health

# Try bootstrapping again
cdklocal bootstrap aws://000000000000/us-east-1
```

### Deployment fails

```bash
# Rebuild first
npm run build

# Check LocalStack logs
docker-compose logs -f localstack

# Try deploying again
npm run deploy:local
```

### Can't find cdklocal command

```bash
# Install awscli-local
pip install awscli-local[ver1]

# Or use npx
npx aws-cdk-local deploy
```

## Next Steps

1. Modify the GraphQL schema in `lib/appsync/schema.graphql`
2. Update resolvers in `lib/appsync/resolvers/`
3. Rebuild with `npm run build`
4. Redeploy with `npm run deploy:local`
5. Test your changes!

## Deploy to Real AWS

When ready to deploy to AWS:

1. Edit `.env`:

   ```
   USE_LOCALSTACK=false
   AWS_REGION=us-east-1
   ```

2. Bootstrap AWS CDK:

   ```bash
   npm run bootstrap
   ```

3. Deploy:

   ```bash
   npm run deploy
   ```

4. Destroy when done:
   ```bash
   npm run destroy
   ```

## Useful Resources

- GraphQL Schema: `lib/appsync/schema.graphql`
- Resolvers: `lib/appsync/resolvers/`
- CDK Stack: `lib/appsync-stack.ts`
- Full Documentation: `README.md`
