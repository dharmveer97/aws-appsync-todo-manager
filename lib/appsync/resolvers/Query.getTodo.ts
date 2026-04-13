import type { Context, DynamoDBGetItemRequest } from '@aws-appsync/utils';

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
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result;
}
