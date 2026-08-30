# AWS AppSync Todo Management System

A full-stack Todo management application with AWS AppSync GraphQL API, DynamoDB with Global Secondary Indexes, and a modern React frontend.

## 🏗️ Architecture

### Backend (AWS)
- **AWS AppSync** - GraphQL API with real-time capabilities
- **DynamoDB** - NoSQL database with Global Secondary Indexes (GSI) for efficient querying
- **CDK** - Infrastructure as Code for AWS resource provisioning

### Frontend (React + Vite)
- **React 19** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** + **shadcn/ui** for styling
- **Atomic Design** folder structure

## 📁 Project Structure

```
aws-appsymc/
├── lib/                          # Backend CDK infrastructure
│   ├── appsync/
│   │   ├── schema.graphql        # GraphQL schema with enums
│   │   └── resolvers/
│   │       ├── Query.getTodo.js      # Get single todo
│   │       ├── Query.listTodos.js    # List todos with GSI query
│   │       ├── Mutation.createTodo.js # Create todo
│   │       ├── Mutation.updateTodo.js # Update todo
│   │       ├── Mutation.deleteTodo.js # Delete single todo
│   │       └── Mutation.deleteTodos.js # Batch delete todos
│   └── appsync-stack.ts          # CDK stack definition
│
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/               # shadcn/ui components
│   │   │   ├── operations/       # CRUD operation components
│   │   │   ├── pages/            # Page components
│   │   ├── lib/
│   │   │   ├── api.ts            # GraphQL API client
│   │   │   ├── types.ts          # TypeScript types
│   │   │   └── utils.ts          # Utility functions
│   ├── .env                      # Environment variables (not committed)
│   ├── .env.example              # Environment template
│   └── seed.ts                   # Database seeding script
│
├── bin/                          # CDK app entry point
├── cdk.json                      # CDK configuration
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- AWS CLI configured with credentials (for real AWS) or dummy credentials (for local development)
- AWS CDK installed globally (`npm install -g aws-cdk`)

### Local Development with Floki (AWS Emulator)

**Option 1: Using the setup script:**
```bash
# Run the automated setup script
./setup-floci.sh

# Follow the instructions to deploy and run
npm run deploy:local
```

**Option 2: Manual setup:**
```bash
# Start Floki (AWS emulator)
docker compose up -d

# Wait for Floki to start
sleep 30

# Set environment variables for local development
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_DEFAULT_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export USE_LOCALSTACK=true  # This enables localstack/floki specific configuration

# Install and build project
npm install
npm run build

# Bootstrap and deploy CDK stack locally
npm run bootstrap:local
npm run deploy:local
```

After deployment, note the outputs:
- `GraphQLAPIURL` - Your AppSync API endpoint
- `GraphQLAPIKey` - Your API key

Update `frontend/.env` with these values.

### 2. Clone and Install

```bash
git clone <your-repo-url>
cd aws-appsymc

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Configure Environment

```bash
# Copy frontend environment template
cp frontend/.env.example frontend/.env

# Edit frontend/.env with your deployed API values
# VITE_APPSYNC_API_URL=your-api-url
# VITE_APPSYNC_API_KEY=your-api-key
```

### 4. Seed Database

```bash
cd frontend
npm run seed
```

### 5. Start Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3000

## 🌍 Production Deployment

For production deployment to real AWS:

```bash
# Bootstrap CDK (first time only)
cdk bootstrap

# Build and deploy
npm run build
cdk deploy --require-approval never
```

## 🔧 CRUD Operations

| Operation | GraphQL | File |
|-----------|---------|------|
| **Create** | `createTodo` | `lib/appsync/resolvers/Mutation.createTodo.js` |
| **Read (Single)** | `getTodo` | `lib/appsync/resolvers/Query.getTodo.js` |
| **Read (List)** | `listTodos` | `lib/appsync/resolvers/Query.listTodos.js` |
| **Update** | `updateTodo` | `lib/appsync/resolvers/Mutation.updateTodo.js` |
| **Delete (Single)** | `deleteTodo` | `lib/appsync/resolvers/Mutation.deleteTodo.js` |
| **Delete (Batch)** | `deleteTodos` | `lib/appsync/resolvers/Mutation.deleteTodos.js` |

### GraphQL Schema

```graphql
enum Status {
  PENDING
  IN_PROGRESS
  COMPLETED
  ARCHIVED
  CANCELLED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

type Todo {
  id: ID!
  title: String!
  subtitle: String
  description: String
  priority: Priority!
  status: Status!
  completed: Boolean!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

## 📊 DynamoDB GSI (Optimized for Millions)

### Global Secondary Indexes

| Index | Partition Key | Sort Key | Purpose |
|-------|---------------|----------|---------|
| `StatusIndex` | `status` | `createdAt` | Query by status |
| `PriorityIndex` | `priority` | `createdAt` | Query by priority |

### Performance

| Dataset | Scan (Old) | GSI Query (New) |
|---------|-----------|-----------------|
| 1M items, 10% filter | ~1M RCU | ~100K RCU (90% savings) |
| 10M items, 1% filter | ~10M RCU | ~100K RCU (99% savings) |

## 🔐 Environment Variables

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_APPSYNC_API_URL` | AppSync GraphQL endpoint |
| `VITE_APPSYNC_API_KEY` | AppSync API key |

> ⚠️ **Security**: `VITE_*` variables are bundled into client code. Never store secrets here.

## 📝 Scripts

### Backend
```bash
npm run build      # Compile TypeScript
npm run deploy     # Deploy to AWS
npm run deploy:local  # Deploy to local Floki/LocalStack
npm run destroy    # Remove AWS resources
npm run destroy:local  # Remove local resources
npm run floci:start # Start Floki using Docker Compose
npm run floci:stop  # Stop Floki using Docker Compose
cdk synth          # Generate CloudFormation
```

### Frontend
```bash
cd frontend
npm run dev        # Dev server (port 3000)
npm run build      # Production build
npm run seed       # Seed 40 test todos
npm run typecheck  # TypeScript check
```

## 🎨 UI Features

- Table view with checkbox selection
- Status & Priority filters
- Pagination (10 per page)
- Inline status update
- Batch delete
- Create form

## 🗑️ Cleanup

```bash
cdk destroy --force
rm -rf node_modules frontend/node_modules
```

## 📄 License

MIT