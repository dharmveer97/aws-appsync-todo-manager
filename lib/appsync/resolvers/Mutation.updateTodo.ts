import type { Context, DynamoDBUpdateItemRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBUpdateItemRequest {
  const { input } = ctx.arguments;
  const { id, ...values } = input;

  const now = util.time.nowISO8601();
  values.updatedAt = now;

  const sets: string[] = [];
  const names: Record<string, string> = {};
  const valuesObj: Record<string, any> = {};

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

  return {
    operation: 'UpdateItem',
    key: {
      id: { S: id }
    },
    update: {
      expression: `SET ${sets.join(', ')}`,
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
