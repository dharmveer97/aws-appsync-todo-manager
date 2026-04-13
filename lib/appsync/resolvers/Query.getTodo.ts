import { Context, DynamoDBGetItemRequest } from '@aws-appsync/utils';

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
  const { error, result } = ctx;

  if (error) {
    return util.error(error.message, error.type);
  }

  return result;
}
