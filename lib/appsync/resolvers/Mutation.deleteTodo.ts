import { util } from '@aws-appsync/utils';
import type { Context, DynamoDBUpdateItemRequest } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';

export function request(ctx: Context): DynamoDBUpdateItemRequest {
  const { id } = ctx.arguments;
  const now = util.time.nowISO8601();

  return ddb.update({
    key: { id },
    update: {
      status: 'ARCHIVED',
      updatedAt: now,
      activePartition: ddb.operations.remove(),
    },
  });
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result;
}
