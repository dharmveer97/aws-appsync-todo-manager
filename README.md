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
- AWS CLI configured with credentials
- AWS CDK installed globally (`npm install -g aws-cdk`)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd aws-appsymc

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Configure Environment

```bash
# Copy frontend environment template
cp frontend/.env.example frontend/.env

# Edit frontend/.env with your deployed API values
# VITE_APPSYNC_API_URL=your-api-url
# VITE_APPSYNC_API_KEY=your-api-key
```

### 3. Deploy Backend

```bash
# Bootstrap CDK (first time only)
cdk bootstrap

# Build and deploy
npm run build
cdk deploy --require-approval never
```

After deployment, note the outputs:
- `GraphQLAPIURL` - Your AppSync API endpoint
- `GraphQLAPIKey` - Your API key

Update `frontend/.env` with these values.

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
npm run destroy    # Remove AWS resources
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