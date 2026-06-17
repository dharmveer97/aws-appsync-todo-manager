import { util } from '@aws-appsync/utils';
import type { Context, DynamoDBTransactWriteItemsRequest } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';

export function request(ctx: Context): DynamoDBTransactWriteItemsRequest {
  const todos = ctx.stash.todos || [];
  const now = util.time.nowISO8601();

  const transactItems: any[] = [];

  // 1. Add updateItem operations for each Todo being archived
  todos.forEach((todo: any) => {
    transactItems.push({
      updateItem: {
        table: 'Todos',
        key: { id: todo.id },
        update: {
          status: 'ARCHIVED',
          updatedAt: now,
          activePartition: ddb.operations.remove()
        },
        condition: {
          status: { ne: 'ARCHIVED' }
        }
      }
    });
  });

  // 2. Decrement the count in the Stats table by the number of active items we are archiving
  if (todos.length > 0) {
    transactItems.push({
      updateItem: {
        table: 'Stats',
        key: { id: 'todos_count' },
        update: {
          count: ddb.operations.decrement(todos.length)
        }
      }
    });
  }

  return ddb.transactWrite({
    items: transactItems
  });
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  
  const todos = ctx.stash.todos || [];
  return todos.map((todo: any) => ({
    ...todo,
    status: 'ARCHIVED'
  }));
}
