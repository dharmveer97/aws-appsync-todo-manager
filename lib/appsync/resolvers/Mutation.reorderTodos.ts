import {
  Context,
  DynamoDBTransactWriteItemsRequest,
  util,
} from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';

export function request(ctx: Context): DynamoDBTransactWriteItemsRequest {
  const { todos } = ctx.arguments;

  if (!todos || todos.length === 0) {
    util.error('No todos provided for reordering', 'BadRequest');
  }

  const now = util.time.nowISO8601();
  const items = todos.map((item: any) => ({
    updateItem: {
      table: 'Todos',
      key: { id: item.id },
      update: {
        orderIndex: item.orderIndex,
        updatedAt: now,
      },
    },
  }));

  return ddb.transactWrite({
    items,
  });
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  const { todos } = ctx.arguments;
  const now = util.time.nowISO8601();
  return todos.map((todo: any) => ({
    id: todo.id,
    orderIndex: todo.orderIndex,
    updatedAt: now,
  }));
}
