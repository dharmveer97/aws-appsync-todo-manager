import {
  Context,
  DynamoDBTransactWriteItemsRequest,
  util,
} from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBTransactWriteItemsRequest {
  const { todos } = ctx.arguments;

  if (!todos || todos.length === 0) {
    util.error('No todos provided for reordering', 'BadRequest');
  }

  const now = util.time.nowISO8601();
  const transactItems = todos.map((item: any) => ({
    table: 'Todos',
    operation: 'UpdateItem',
    key: {
      id: { S: item.id },
    },
    update: {
      expression: 'SET #orderIndex = :orderIndex, #updatedAt = :updatedAt',
      expressionNames: {
        '#orderIndex': 'orderIndex',
        '#updatedAt': 'updatedAt',
      },
      expressionValues: util.dynamodb.toMapValues({
        ':orderIndex': item.orderIndex,
        ':updatedAt': now,
      }),
    },
  }));

  return {
    operation: 'TransactWriteItems',
    transactItems,
  };
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
