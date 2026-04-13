import type { Context, DynamoDBDeleteItemRequest } from '@aws-appsync/utils';

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
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result;
}
