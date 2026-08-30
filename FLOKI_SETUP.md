# Setting up Floki (AWS Emulator) for AWS AppSync Todo Manager

Floki is a free, open-source local AWS emulator that can replace LocalStack for development. This guide will walk you through setting up Floki to work with the AWS AppSync Todo Manager project.

## Prerequisites

### 1. Install Docker
First, you'll need to install Docker to run Floki:

**On macOS:**
```bash
# Download and install Docker Desktop for Mac:
# https://desktop.docker.com/mac/main/arm64/Docker.dmg

# Or using Homebrew:
brew install --cask docker
```

**On Windows:**
- Download Docker Desktop for Windows: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

**On Linux:**
```bash
# For Ubuntu/Debian:
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER
```

After installation, start Docker Desktop/Docker Engine and ensure it's running.

### 2. Install Docker Compose
Docker Compose should come bundled with Docker Desktop. Verify it's available:
```bash
docker compose version
```

## Running the Project with Floki

### 1. Start Floki
```bash
# Navigate to the project directory
cd /Users/dharamveerbangar/Projects/aws-appsync-todo-manager

# Start Floki using Docker Compose
docker compose up -d
```

Wait about 30 seconds for Floki to fully start.

### 2. Configure Environment for Local Development
Set the environment variables to point to Floki:

```bash
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_DEFAULT_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export USE_LOCALSTACK=true
```

### 3. Deploy the CDK Stack to Floki
```bash
# Install dependencies if you haven't already
npm install

# Build the project
npm run build

# Bootstrap CDK for local development (one-time setup)
npm run bootstrap:local

# Deploy the stack to Floki
npm run deploy:local
```

### 4. Set Up Frontend Environment
After deploying, you'll get outputs with the API URL and key. Create/update the frontend environment:

```bash
# After deployment completes, note the outputs which will look like:
# AppSyncTodoStack.GraphQLAPIURL = https://xxx.appsync-local.amazonaws.com/graphql
# AppSyncTodoStack.GraphQLAPIKey = da2-xxxxxxxxxxxxxxxxxxxxxxxxxx

# Copy the values and update the frontend .env file:
cd frontend
cp .env.example .env

# Edit the .env file to use Floki's endpoints:
# VITE_APPSYNC_API_URL=https://xxx.appsync-local.amazonaws.com/graphql  
# VITE_APPSYNC_API_KEY=da2-xxxxxxxxxxxxxxxxxxxxxxxxxx

# Install frontend dependencies
npm install
```

### 5. Seed the Database
```bash
# Make sure your .env has the correct API values
npm run seed
```

### 6. Run the Frontend
```bash
npm run dev
```

The app will be available at http://localhost:3000

## Available Scripts

The following scripts have been added to work with Floki/local development:

- `npm run floci:start` - Start Floki using Docker Compose
- `npm run floci:stop` - Stop Floki using Docker Compose
- `npm run deploy:local` - Deploy to local Floki/LocalStack
- `npm run destroy:local` - Destroy local stack
- `npm run bootstrap:local` - Bootstrap CDK for local development

## Testing Floki Manually

You can test Floki directly with AWS CLI:

```bash
# Test DynamoDB
aws dynamodb list-tables --endpoint-url http://localhost:4566

# Test AppSync
aws appsync list-graphql-apis --endpoint-url http://localhost:4566
```

## Troubleshooting

### Common Issues:

1. **Floki won't start**: Ensure Docker is running and you have sufficient permissions
2. **CDK deployment fails**: Make sure the environment variables are set and you ran `npm run bootstrap:local`
3. **Frontend can't connect**: Verify the API URL and key in `frontend/.env` are correct

### Resetting Everything:
```bash
# Stop Floki
docker compose down

# Destroy local stack
npm run destroy:local

# Clean and rebuild
rm -rf node_modules
npm install
npm run build

# Restart Floki
docker compose up -d

# Redeploy
npm run deploy:local
```

## Floki vs LocalStack

This project was originally configured for LocalStack but works identically with Floki. Both provide:
- Full AWS AppSync emulation
- DynamoDB with all required features
- Support for all AWS services used in the project
- Same API endpoints and interfaces

The only difference is the Docker image used in `docker-compose.yml`.