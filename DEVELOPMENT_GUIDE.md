# Local Development Guide

## Development Workflow

### Quick Cycle
```bash
# 1. Make changes to code
# 2. Build
npm run build

# 3. Deploy to LocalStack
npm run deploy:local

# 4. Test
# Use GraphQL playground or curl
```

### Example: Adding an Author Feature

Let's add Authors to the Todo app as a complete example!

## Step 1: Update GraphQL Schema

Edit `lib/appsync/schema.graphql` and add Author types:

```graphql
type Author {
  id: ID!
  name: String!
  email: String!
  bio: String
  todoCount: Int!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

input CreateAuthorInput {
  name: String!
  email: String!
  bio: String
}

input UpdateAuthorInput {
  id: ID!
  name: String
  email: String
  bio: String
}

type AuthorConnection {
  items: [Author]
  nextToken: String
}

# Add to existing Query type
type Query {
  getTodo(id: ID!): Todo
  listTodos(limit: Int, nextToken: String): TodoConnection

  # NEW: Author queries
  getAuthor(id: ID!): Author
  listAuthors(limit: Int, nextToken: String): AuthorConnection
}

# Add to existing Mutation type
type Mutation {
  createTodo(input: CreateTodoInput!): Todo
  updateTodo(input: UpdateTodoInput!): Todo
  deleteTodo(id: ID!): Todo

  # NEW: Author mutations
  createAuthor(input: CreateAuthorInput!): Author
  updateAuthor(input: UpdateAuthorInput!): Author
  deleteAuthor(id: ID!): Author
}
```

## Step 2: Create TypeScript Resolvers

### Create `lib/appsync/resolvers/Query.getAuthor.ts`:
```typescript
import { Context, DynamoDBGetItemRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBGetItemRequest {
  const { id } = ctx.arguments;

  return {
    operation: 'GetItem',
    key: {
      id: { S: id }
    }
  };
}

export function response(ctx: Context) {
  const { error, result } = ctx;

  if (error) {
    return util.error(error.message, error.type);
  }

  return result;
}
```

### Create `lib/appsync/resolvers/Query.listAuthors.ts`:
```typescript
import { Context, DynamoDBScanRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBScanRequest {
  const { limit = 20, nextToken } = ctx.arguments;

  return {
    operation: 'Scan',
    limit,
    nextToken
  };
}

export function response(ctx: Context) {
  const { error, result } = ctx;

  if (error) {
    return util.error(error.message, error.type);
  }

  return {
    items: result.items,
    nextToken: result.nextToken
  };
}
```

### Create `lib/appsync/resolvers/Mutation.createAuthor.ts`:
```typescript
import { Context, DynamoDBPutItemRequest, util } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBPutItemRequest {
  const { input } = ctx.arguments;
  const id = util.autoId();
  const now = util.time.nowISO8601();

  const author = {
    __typename: 'Author',
    id,
    name: input.name,
    email: input.email,
    bio: input.bio || '',
    todoCount: 0,
    createdAt: now,
    updatedAt: now
  };

  return {
    operation: 'PutItem',
    key: {
      id: { S: id }
    },
    attributeValues: util.dynamodb.toMapValues(author)
  };
}

export function response(ctx: Context) {
  const { error, result } = ctx;

  if (error) {
    return util.error(error.message, error.type);
  }

  return result;
}
```

### Create `lib/appsync/resolvers/Mutation.updateAuthor.ts`:
```typescript
import { Context, DynamoDBUpdateItemRequest, util } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBUpdateItemRequest {
  const { input } = ctx.arguments;
  const { id, ...values } = input;

  const now = util.time.nowISO8601();
  values.updatedAt = now;

  return {
    operation: 'UpdateItem',
    key: {
      id: { S: id }
    },
    update: {
      expression: 'SET #name = :name, #email = :email, #bio = :bio, #updatedAt = :updatedAt',
      expressionNames: {
        '#name': 'name',
        '#email': 'email',
        '#bio': 'bio',
        '#updatedAt': 'updatedAt'
      },
      expressionValues: util.dynamodb.toMapValues({
        ':name': values.name,
        ':email': values.email,
        ':bio': values.bio,
        ':updatedAt': values.updatedAt
      })
    }
  };
}

export function response(ctx: Context) {
  const { error, result } = ctx;

  if (error) {
    return util.error(error.message, error.type);
  }

  return result;
}
```

### Create `lib/appsync/resolvers/Mutation.deleteAuthor.ts`:
```typescript
import { Context, DynamoDBDeleteItemRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBDeleteItemRequest {
  const { id } = ctx.arguments;

  return {
    operation: 'DeleteItem',
    key: {
      id: { S: id }
    }
  };
}

export function response(ctx: Context) {
  const { error, result } = ctx;

  if (error) {
    return util.error(error.message, error.type);
  }

  return result;
}
```

## Step 3: Update CDK Stack

Edit `lib/appsync-stack.ts` and add Author table and resolvers:

```typescript
// Add after the Todos table
const authorsTable = new dynamodb.Table(this, 'AuthorsTable', {
  tableName: 'Authors',
  partitionKey: {
    name: 'id',
    type: dynamodb.AttributeType.STRING
  },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

// Add data source
const authorsDataSource = api.addDynamoDbDataSource(
  'AuthorsDataSource',
  authorsTable
);

// Add Query resolvers
authorsDataSource.createResolver('GetAuthorResolver', {
  typeName: 'Query',
  fieldName: 'getAuthor',
  runtime: appsync.FunctionRuntime.JS_1_0_0,
  code: appsync.Code.fromAsset(
    path.join(__dirname, 'appsync/resolvers/Query.getAuthor.js')
  )
});

authorsDataSource.createResolver('ListAuthorsResolver', {
  typeName: 'Query',
  fieldName: 'listAuthors',
  runtime: appsync.FunctionRuntime.JS_1_0_0,
  code: appsync.Code.fromAsset(
    path.join(__dirname, 'appsync/resolvers/Query.listAuthors.js')
  )
});

// Add Mutation resolvers
authorsDataSource.createResolver('CreateAuthorResolver', {
  typeName: 'Mutation',
  fieldName: 'createAuthor',
  runtime: appsync.FunctionRuntime.JS_1_0_0,
  code: appsync.Code.fromAsset(
    path.join(__dirname, 'appsync/resolvers/Mutation.createAuthor.js')
  )
});

authorsDataSource.createResolver('UpdateAuthorResolver', {
  typeName: 'Mutation',
  fieldName: 'updateAuthor',
  runtime: appsync.FunctionRuntime.JS_1_0_0,
  code: appsync.Code.fromAsset(
    path.join(__dirname, 'appsync/resolvers/Mutation.updateAuthor.js')
  )
});

authorsDataSource.createResolver('DeleteAuthorResolver', {
  typeName: 'Mutation',
  fieldName: 'deleteAuthor',
  runtime: appsync.FunctionRuntime.JS_1_0_0,
  code: appsync.Code.fromAsset(
    path.join(__dirname, 'appsync/resolvers/Mutation.deleteAuthor.js')
  )
});

// Add output
new cdk.CfnOutput(this, 'AuthorsTableName', {
  value: authorsTable.tableName,
  description: 'Authors DynamoDB Table Name',
  exportName: 'AuthorsTableName'
});
```

## Step 4: Build and Deploy

```bash
# Build TypeScript
npm run build

# Deploy to LocalStack
npm run deploy:local
```

## Step 5: Test Your Changes

### Using curl:
```bash
# Set your API details
API_URL="http://localhost:4566/graphql/YOUR_API_ID"
API_KEY="da2-fakeApiId123456"

# Create an Author
curl -X POST "$API_URL" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createAuthor(input: { name: \"John Doe\", email: \"john@example.com\", bio: \"Software Developer\" }) { id name email bio todoCount createdAt } }"
  }' | jq

# List Authors
curl -X POST "$API_URL" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { listAuthors { items { id name email bio todoCount createdAt } } }"
  }' | jq

# Get specific Author
curl -X POST "$API_URL" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { getAuthor(id: \"AUTHOR_ID_HERE\") { id name email bio todoCount } }"
  }' | jq
```

### Using GraphQL Playground:
```
http://localhost:4566/_aws/appsync/graphiql?apiId=YOUR_API_ID
```

Then try:
```graphql
mutation CreateAuthor {
  createAuthor(input: {
    name: "Jane Smith"
    email: "jane@example.com"
    bio: "Product Manager"
  }) {
    id
    name
    email
    bio
    todoCount
    createdAt
    updatedAt
  }
}

query ListAuthors {
  listAuthors {
    items {
      id
      name
      email
      bio
      todoCount
      createdAt
    }
    nextToken
  }
}
```

## Development Tips

### 1. Watch Mode
Run TypeScript in watch mode while developing:
```bash
npm run watch
```

Then in another terminal:
```bash
npm run deploy:local
```

### 2. Check Logs
```bash
# LocalStack logs
docker-compose logs -f localstack

# Or specific service
docker-compose logs -f
```

### 3. Reset Everything
```bash
# Destroy stack
npm run destroy:local

# Stop LocalStack
docker-compose down

# Remove volumes (fresh start)
docker-compose down -v

# Start fresh
docker-compose up -d
npm run deploy:local
```

### 4. Test Locally Before AWS
Always test with LocalStack first:
```bash
# Test locally
npm run deploy:local
# ... test your changes ...

# Then deploy to AWS
npm run deploy
```

### 5. Environment Switching
```bash
# Local development (.env)
USE_LOCALSTACK=true

# AWS deployment (.env)
USE_LOCALSTACK=false
```

## Common Patterns

### Add a new field to existing type:
1. Update `schema.graphql`
2. Update resolver if needed
3. `npm run build`
4. `npm run deploy:local`

### Add a new resolver:
1. Create `.ts` file in `lib/appsync/resolvers/`
2. Add resolver to `lib/appsync-stack.ts`
3. `npm run build`
4. `npm run deploy:local`

### Add a new DynamoDB table:
1. Add table definition in `lib/appsync-stack.ts`
2. Add data source
3. Create resolvers
4. `npm run build`
5. `npm run deploy:local`

## Debugging

### Check compiled code:
```bash
cat dist/lib/appsync/resolvers/Query.getAuthor.js
```

### Validate GraphQL schema:
```bash
# Install graphql tools
npm install -g graphql

# Validate
graphql-schema-linter lib/appsync/schema.graphql
```

### Check DynamoDB data (LocalStack):
```bash
# Install awscli-local
pip install awscli-local

# List tables
awslocal dynamodb list-tables

# Scan table
awslocal dynamodb scan --table-name Authors

# Get item
awslocal dynamodb get-item \
  --table-name Authors \
  --key '{"id":{"S":"your-id-here"}}'
```

## Best Practices

1. **Always build before deploy**
   ```bash
   npm run build && npm run deploy:local
   ```

2. **Test locally first**
   - Use LocalStack for development
   - Only deploy to AWS when ready

3. **Version control**
   - Commit schema changes
   - Commit resolver changes
   - Commit stack changes together

4. **Incremental development**
   - Add one feature at a time
   - Test after each change
   - Deploy frequently to LocalStack

5. **Use TypeScript**
   - Type safety prevents errors
   - Better IDE support
   - Compile-time validation

## Workflow Summary

```
Edit Code → Build → Deploy Local → Test → Commit
    ↓          ↓         ↓           ↓       ↓
 .ts/.graphql  tsc   cdklocal    curl/UI   git
```

## Next Steps

- Add relations between Todos and Authors
- Add authentication
- Add subscriptions for real-time updates
- Add data validation
- Add error handling
- Add pagination
- Add filtering and sorting
