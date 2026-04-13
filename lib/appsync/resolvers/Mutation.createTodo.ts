import { Context, DynamoDBPutItemRequest, util } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBPutItemRequest {
  const { input } = ctx.arguments;
  const id = util.autoId();
  const now = util.time.nowISO8601();

  let owner = 'anonymous';
  if (ctx.identity) {
    const identity = ctx.identity as any;
    owner = identity.sub || identity.username || 'anonymous';
  }

  const todo = {
    __typename: 'Todo',
    id,
    title: input.title,
    subtitle: input.subtitle || '',
    description: input.description || '',
    priority: input.priority || 'MEDIUM',
    status: input.status || 'PENDING',
    completed: input.completed || false,
    owner,
    createdAt: now,
    updatedAt: now
  };

  return {
    operation: 'PutItem',
    key: {
      id: { S: id }
    },
    attributeValues: util.dynamodb.toMapValues(todo)
  };
}

export function response(ctx: Context) {
  const { error, result } = ctx;

  if (error) {
    return util.error(error.message, error.type);
  }

  return result;
}
