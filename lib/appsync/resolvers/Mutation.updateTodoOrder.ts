import type { Context, DynamoDBUpdateItemRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBUpdateItemRequest {
  const { input } = ctx.arguments;
  const { id, orderIndex } = input;
  const now = util.time.nowISO8601();

  return {
    operation: 'UpdateItem',
    key: {
      id: { S: id }
    },
    update: {
      expression: 'SET #orderIndex = :orderIndex, #updatedAt = :updatedAt',
      expressionNames: {
        '#orderIndex': 'orderIndex',
        '#updatedAt': 'updatedAt'
      },
      expressionValues: util.dynamodb.toMapValues({
        ':orderIndex': orderIndex,
        ':updatedAt': now
      })
    }
  };
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result;
}
