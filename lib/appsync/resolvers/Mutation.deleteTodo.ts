import { util } from '@aws-appsync/utils';
import type { Context, DynamoDBTransactWriteItemsRequest } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';

export function request(ctx: Context): DynamoDBTransactWriteItemsRequest {
  const { id } = ctx.arguments;
  const now = util.time.nowISO8601();

  return ddb.transactWrite({
    items: [
      {
        updateItem: {
          table: 'Todos',
          key: { id },
          update: {
            status: 'ARCHIVED',
            updatedAt: now,
            activePartition: ddb.operations.remove(),
          },
          condition: {
            status: { ne: 'ARCHIVED' }
          }
        }
      },
      {
        updateItem: {
          table: 'Stats',
          key: { id: 'todos_count' },
          update: {
            count: ddb.operations.decrement(1)
          }
        }
      }
    ]
  });
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return {
    id: ctx.arguments.id,
    status: 'ARCHIVED'
  };
}
