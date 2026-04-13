# AWS AppSync Todo API with CDK and LocalStack

A complete AWS AppSync GraphQL API with DynamoDB backend, built using AWS CDK and supporting local development with LocalStack.

## Features

- GraphQL API with AppSync
- DynamoDB for data persistence
- TypeScript resolvers using @aws-appsync/utils
- Full CRUD operations for Todo items
- Local development with LocalStack (FREE)
- AWS deployment ready
- CDK Infrastructure as Code

## Prerequisites

- Node.js 18+ and npm
- AWS CLI configured (for AWS deployment)
- Docker and Docker Compose (for LocalStack)
- Python 3 and pip (for awscli-local)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Install LocalStack Tools (for local development)

```bash
# Install LocalStack CLI
pip install localstack

# Install awscli-local (cdklocal wrapper)
pip install awscli-local[ver1]
```

### 3. Build TypeScript Resolvers

```bash
npm run build
```

## Local Development with LocalStack

LocalStack allows you to run AWS services locally for FREE, perfect for development without AWS costs!

### Start LocalStack

```bash
# Option 1: Using Docker Compose (recommended)
docker-compose up -d

# Option 2: Using LocalStack CLI
npm run localstack:start
```

### Bootstrap CDK for LocalStack

```bash
cdklocal bootstrap
```

### Deploy to LocalStack

```bash
npm run deploy:local
```

### Get API Information

After deployment, the outputs will show:
- GraphQL API URL (typically: http://localhost:4566/graphql/[API_ID])
- API Key
- DynamoDB Table Name

### Test with GraphQL Playground

You can access the AppSync GraphQL playground at:
```
http://localhost:4566/_aws/appsync/graphiql?apiId=[YOUR_API_ID]
```

### Example Mutations and Queries

```graphql
# Create a Todo
mutation CreateTodo {
  createTodo(input: {
    title: "Learn AWS AppSync"
    description: "Study AppSync with LocalStack"
    completed: false
  }) {
    id
    title
    description
    completed
    owner
    createdAt
    updatedAt
  }
}

# List all Todos
query ListTodos {
  listTodos {
    items {
      id
      title
      description
      completed
      owner
      createdAt
      updatedAt
    }
    nextToken
  }
}

# Get a specific Todo
query GetTodo {
  getTodo(id: "your-todo-id") {
    id
    title
    description
    completed
    owner
    createdAt
    updatedAt
  }
}

# Update a Todo
mutation UpdateTodo {
  updateTodo(input: {
    id: "your-todo-id"
    title: "Updated Title"
    completed: true
  }) {
    id
    title
    completed
    updatedAt
  }
}

# Delete a Todo
mutation DeleteTodo {
  deleteTodo(id: "your-todo-id") {
    id
    title
  }
}
```

### Destroy LocalStack Stack

```bash
npm run destroy:local
```

### Stop LocalStack

```bash
# If using docker-compose
docker-compose down

# If using LocalStack CLI
npm run localstack:stop
```

## AWS Deployment

### Configure Environment

1. Copy `.env.example` to `.env` and update:
```bash
cp .env.example .env
```

2. Edit `.env`:
```
USE_LOCALSTACK=false
AWS_REGION=us-east-1
CDK_DEFAULT_ACCOUNT=your-account-id
CDK_DEFAULT_REGION=us-east-1
```

### Bootstrap CDK (first time only)

```bash
npm run bootstrap
```

### Deploy to AWS

```bash
npm run deploy
```

### Destroy AWS Stack

```bash
npm run destroy
```

## Project Structure

```
.
├── bin/
│   └── app.ts                 # CDK App entry point
├── lib/
│   ├── appsync-stack.ts       # Main CDK stack
│   └── appsync/
│       ├── schema.graphql     # GraphQL schema
│       └── resolvers/         # AppSync resolvers
│           ├── utils.ts
│           ├── Query.getTodo.ts
│           ├── Query.listTodos.ts
│           ├── Mutation.createTodo.ts
│           ├── Mutation.updateTodo.ts
│           └── Mutation.deleteTodo.ts
├── package.json
├── tsconfig.json
├── cdk.json
├── docker-compose.yml         # LocalStack configuration
└── README.md
```

## Available Scripts

- `npm run build` - Compile TypeScript
- `npm run watch` - Watch for changes
- `npm run cdk` - Run CDK commands
- `npm run deploy` - Deploy to AWS
- `npm run deploy:local` - Deploy to LocalStack
- `npm run destroy` - Destroy AWS stack
- `npm run destroy:local` - Destroy LocalStack stack
- `npm run bootstrap` - Bootstrap CDK on AWS
- `npm run bootstrap:local` - Bootstrap CDK on LocalStack
- `npm run localstack:start` - Start LocalStack
- `npm run localstack:stop` - Stop LocalStack

## GraphQL Schema

The API provides a complete Todo management system with:

- **Queries**: `getTodo`, `listTodos`
- **Mutations**: `createTodo`, `updateTodo`, `deleteTodo`
- **Types**: Todo, TodoConnection, CreateTodoInput, UpdateTodoInput

## Key Technologies

- **AWS CDK** - Infrastructure as Code
- **AWS AppSync** - Managed GraphQL service
- **DynamoDB** - NoSQL database
- **@aws-appsync/utils** - AppSync resolver utilities
- **LocalStack** - Local AWS cloud stack
- **TypeScript** - Type-safe development

## Benefits of LocalStack

1. **FREE** - No AWS costs during development
2. **Fast** - Instant deployments locally
3. **Offline** - Work without internet
4. **Testing** - Safe environment for experiments
5. **Productivity** - Rapid iteration cycle

## Troubleshooting

### LocalStack not starting
- Ensure Docker is running
- Check port 4566 is not in use
- Try `docker-compose down && docker-compose up -d`

### CDK bootstrap fails
- Make sure LocalStack is running
- Verify AWS CLI is configured
- Check your .env file settings

### Resolvers not found
- Run `npm run build` before deploying
- Check that .js files are generated in lib/appsync/resolvers/

### API Key not working
- LocalStack may have different auth behavior
- Check API key in deployment outputs
- Try using API_KEY authorization mode

## Next Steps

- Add authentication with Cognito
- Implement subscriptions for real-time updates
- Add more complex queries with filters
- Set up CI/CD pipeline
- Add unit and integration tests
- Implement DataLoader for batch operations

## Resources

- [AWS AppSync Documentation](https://docs.aws.amazon.com/appsync/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [LocalStack Documentation](https://docs.localstack.cloud/)
- [@aws-appsync/utils](https://www.npmjs.com/package/@aws-appsync/utils)

## License

MIT
