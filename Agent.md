# Coding Agent Instructions for this Repository

Welcome, AI Agent! Follow these strict instructions when writing code for this repository. Local coding models (like Llama, Qwen, or DeepSeek via Ollama) must copy these exact syntax patterns to avoid hallucinations.

---

## 1. AppSync DynamoDB Resolver Rules

Always import and use the `@aws-appsync/utils/dynamodb` helpers. **NEVER** write raw JSON containing `expression`, `expressionNames`, or `expressionValues`.

### Pattern A: Querying items (`ddb.query`)
```typescript
import * as ddb from '@aws-appsync/utils/dynamodb';
import type { Context, DynamoDBQueryRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBQueryRequest {
  return ddb.query({
    index: 'ActiveIndex',
    query: {
      activePartition: { eq: 'ALL_ACTIVE' }
    },
    limit: ctx.arguments.limit || 10,
    nextToken: ctx.arguments.nextToken
  });
}
```

### Pattern B: Creating items (`ddb.put`)
```typescript
import { util } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';
import type { Context, DynamoDBPutItemRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBPutItemRequest {
  const { input } = ctx.arguments;
  const id = util.autoId();
  const now = util.time.nowISO8601();

  return ddb.put({
    key: { id },
    item: {
      ...input,
      createdAt: now,
      updatedAt: now,
      orderIndex: Math.floor(util.time.nowEpochMilliSeconds() / 1000),
      activePartition: 'ALL_ACTIVE' // Mandatory for sparse index
    }
  });
}
```

### Pattern C: Updating items dynamically (`ddb.update`)
```typescript
import { util } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';
import type { Context, DynamoDBUpdateItemRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBUpdateItemRequest {
  const { input } = ctx.arguments;
  const { id, ...values } = input;

  const updateObj: Record<string, any> = {};
  Object.keys(values).forEach((key) => {
    if (values[key] !== undefined) {
      updateObj[key] = values[key];
    }
  });
  updateObj.updatedAt = util.time.nowISO8601();

  // If status is updated to ARCHIVED, remove from the sparse index
  if (values.status !== undefined) {
    if (values.status === 'ARCHIVED') {
      updateObj.activePartition = ddb.operations.remove();
    } else {
      updateObj.activePartition = 'ALL_ACTIVE';
    }
  }

  return ddb.update({
    key: { id },
    update: updateObj
  });
}
```

### Pattern D: Soft-Deleting items (`ddb.update` + remove)
```typescript
import { util } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';
import type { Context, DynamoDBUpdateItemRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBUpdateItemRequest {
  const { id } = ctx.arguments;
  return ddb.update({
    key: { id },
    update: {
      status: 'ARCHIVED',
      updatedAt: util.time.nowISO8601(),
      activePartition: ddb.operations.remove() // Removes from active GSI index
    }
  });
}
```

### Pattern E: Atomic Increment/Decrement (`ddb.operations.increment`)
Always use `ddb.operations.increment` or `ddb.operations.decrement` for updating counters (e.g. view counters, stock, likes).
* **Why:** It is price-friendly and thread-safe. It performs a single Write operation on DynamoDB directly, instead of a costly Read-then-Write (which uses both Read and Write capacity and causes race conditions).
```typescript
import * as ddb from '@aws-appsync/utils/dynamodb';
import type { Context, DynamoDBUpdateItemRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBUpdateItemRequest {
  const { id } = ctx.arguments;
  return ddb.update({
    key: { id },
    update: {
      viewsCount: ddb.operations.increment(1) // Atomic increment (+1)
    }
  });
}
```

### Pattern F: Multi-Table Transaction Updates (`ddb.transactWrite`)
When updating multiple tables at once securely (e.g. creating a Todo in `Todos` and incrementing total counts in `TableStats`), always use `ddb.transactWrite` to ensure both operations succeed or fail together (ACID compliance).
```typescript
import * as ddb from '@aws-appsync/utils/dynamodb';
import type { Context, DynamoDBTransactWriteItemsRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBTransactWriteItemsRequest {
  const { id, title } = ctx.arguments;
  return ddb.transactWrite({
    items: [
      {
        putItem: {
          table: 'Todos',
          key: { id },
          item: { title }
        }
      },
      {
        updateItem: {
          table: 'TableStats',
          key: { tableName: 'Todos' },
          update: {
            totalCount: ddb.operations.increment(1)
          }
        }
      }
    ]
  });
}
```

---

## 2. Pagination Logic (Frontend)
* Always track the cursor of the current page using `currentToken`.
* Keep a stack of previous page cursors in `prevTokens`.
* **Previous Page Handler**: Pop the last cursor from `prevTokens`, set it to `currentToken`, and reload.
* **Mutations Refresh**: Always reload by calling `loadTodos(currentToken)` to refresh the active page without breaking the cursor position.
