import { util } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';
import type { Context, DynamoDBTransactWriteItemsRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBTransactWriteItemsRequest {
  const { ids } = ctx.arguments;

  if (!ids || ids.length === 0) {
    util.error('No IDs provided for deletion', 'BadRequest');
  }

  const now = util.time.nowISO8601();

  const items: any[] = ids.map((id: string) => ({
    updateItem: {
      table: 'Todos',
      key: { id },
      update: {
        status: 'ARCHIVED',
        updatedAt: now,
        activePartition: ddb.operations.remove(),
      },
    },
  }));

  // Decrement the active todos count in the Stats table
  items.push({
    updateItem: {
      table: 'Stats',
      key: { id: 'todos_count' },
      update: {
        count: ddb.operations.decrement(ids.length),
      },
    },
  });

  return ddb.transactWrite({
    items,
  });
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  const { ids } = ctx.arguments;
  return ids.map((id: string) => ({
    id,
    status: 'ARCHIVED',
  }));
}