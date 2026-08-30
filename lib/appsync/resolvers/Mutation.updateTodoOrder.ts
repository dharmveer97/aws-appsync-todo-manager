import { util } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';
import type { Context, DynamoDBUpdateItemRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBUpdateItemRequest {
  const { id, orderIndex } = ctx.arguments.input;
  const now = util.time.nowISO8601();

  return ddb.update({
    key: { id },
    update: {
      orderIndex,
      updatedAt: now,
    },
  });
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result;
}

