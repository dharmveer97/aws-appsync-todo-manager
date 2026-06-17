import { util } from '@aws-appsync/utils';
import type { Context, DynamoDBUpdateItemRequest } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';

export function request(ctx: Context): DynamoDBUpdateItemRequest {
  const { input } = ctx.arguments;
  const { id, ...values } = input;

  const now = util.time.nowISO8601();

  const updateObj: Record<string, any> = {};

  Object.keys(values).forEach((key) => {
    if (values[key] !== undefined) {
      updateObj[key] = values[key];
    }
  });

  updateObj.updatedAt = now;

  // Adjust activePartition based on status updates
  if (values.status !== undefined) {
    if (values.status === 'ARCHIVED') {
      updateObj.activePartition = ddb.operations.remove();
    } else {
      updateObj.activePartition = 'ALL_ACTIVE';
    }
  }

  if (Object.keys(updateObj).length === 0) {
    util.error('No fields to update', 'BadRequest');
  }

  return ddb.update({
    key: { id },
    update: updateObj,
  });
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result;
}
