import { util } from '@aws-appsync/utils';
import type { Context, DynamoDBBatchGetItemRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBBatchGetItemRequest {
  const { ids } = ctx.arguments;

  if (!ids || ids.length === 0) {
    util.error('No IDs provided for deletion', 'BadRequest');
  }

  const keys = ids.map((id: string) => ({
    id: { S: id }
  }));

  return {
    operation: 'BatchGetItem',
    tables: {
      Todos: {
        keys,
        consistentRead: true
      }
    }
  };
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  
  const items = ctx.result.data?.Todos || [];
  ctx.stash.todos = items;
  return items;
}
