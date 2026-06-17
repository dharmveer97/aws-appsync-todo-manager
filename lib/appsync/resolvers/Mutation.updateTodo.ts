import { util } from '@aws-appsync/utils';
import type { Context, DynamoDBUpdateItemRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBUpdateItemRequest {
  const { input } = ctx.arguments;
  const { id, ...values } = input;

  const now = util.time.nowISO8601();
  values.updatedAt = now;

  const sets: string[] = [];
  const removes: string[] = [];
  const names: Record<string, string> = {};
  const valuesObj: Record<string, any> = {};

  // Adjust activePartition based on status updates
  if (values.status !== undefined) {
    if (values.status === 'ARCHIVED') {
      removes.push('#activePartition');
      names['#activePartition'] = 'activePartition';
    } else {
      sets.push('#activePartition = :activePartition');
      names['#activePartition'] = 'activePartition';
      valuesObj[':activePartition'] = 'ALL_ACTIVE';
    }
  }

  Object.keys(values).forEach((key) => {
    if (values[key] !== undefined) {
      sets.push(`#${key} = :${key}`);
      names[`#${key}`] = key;
      valuesObj[`:${key}`] = values[key];
    }
  });

  if (sets.length === 0) {
    util.error('No fields to update', 'BadRequest');
  }

  let expression = `SET ${sets.join(', ')}`;
  if (removes.length > 0) {
    expression += ` REMOVE ${removes.join(', ')}`;
  }

  return {
    operation: 'UpdateItem',
    key: {
      id: { S: id }
    },
    update: {
      expression,
      expressionNames: names,
      expressionValues: util.dynamodb.toMapValues(valuesObj)
    }
  };
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result;
}
