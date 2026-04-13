import type { Context, DynamoDBBatchDeleteItemRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBBatchDeleteItemRequest {
  const { ids } = ctx.arguments;

  if (!ids || ids.length === 0) {
    util.error('No IDs provided for deletion', 'BadRequest');
  }

  const keys = ids.map((id: string) => ({
    id: { S: id }
  }));

  return {
    operation: 'BatchDeleteItem',
    tables: {
      Todos: keys
    }
  };
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result?.Todos || [];
}