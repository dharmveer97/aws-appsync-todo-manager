import { util } from '@aws-appsync/utils';
import type {
  Context,
  DynamoDBTransactWriteItemsRequest,
} from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';

export function request(ctx: Context): DynamoDBTransactWriteItemsRequest {
  const { input } = ctx.arguments;
  const id = util.autoId();
  const now = util.time.nowISO8601();

  let owner = 'anonymous';
  if (ctx.identity) {
    const identity = ctx.identity as any;
    owner = identity.sub || identity.username || 'anonymous';
  }

  const todo: Record<string, any> = {
    __typename: 'Todo',
    id,
    title: input.title,
    subtitle: input.subtitle || '',
    description: input.description || '',
    priority: input.priority || 'MEDIUM',
    status: input.status || 'PENDING',
    completed: input.completed || false,
    owner,
    createdAt: now,
    updatedAt: now,
    orderIndex: Math.floor(util.time.nowEpochMilliSeconds() / 1000),
  };

  if (todo.status !== 'ARCHIVED') {
    todo.activePartition = 'ALL_ACTIVE';
  }

  // Stash the todo so we can return it in the response mapping
  ctx.stash.todo = todo;

  return ddb.transactWrite({
    items: [
      {
        putItem: {
          table: 'Todos',
          key: { id },
          item: todo,
        },
      },
      {
        updateItem: {
          table: 'Stats',
          key: { id: 'todos_count' },
          update: {
            count: ddb.operations.increment(1),
          },
        },
      },
    ],
  });
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.stash.todo;
}
