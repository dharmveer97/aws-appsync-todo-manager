import { util } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';
import type { Context, DynamoDBGetItemRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBGetItemRequest {
  const { id } = ctx.arguments;
  return ddb.get({
    key: { id },
  });
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  const result = ctx.result;
  if (result && result.status === 'ARCHIVED') {
    return null;
  }
  return result;
}

