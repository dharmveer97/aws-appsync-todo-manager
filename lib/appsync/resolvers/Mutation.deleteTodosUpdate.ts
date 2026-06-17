import { util } from '@aws-appsync/utils';
import type { Context, DynamoDBBatchPutItemRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBBatchPutItemRequest {
  const todos = ctx.stash.todos || [];
  const now = util.time.nowISO8601();

  const updatedTodos = todos.map((todo: any) => {
    const updated = {
      ...todo,
      status: 'ARCHIVED',
      updatedAt: now
    };
    delete updated.activePartition;
    return updated;
  });

  return {
    operation: 'BatchPutItem',
    tables: {
      Todos: updatedTodos.map((t: any) => util.dynamodb.toMapValues(t))
    }
  };
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  
  const todos = ctx.stash.todos || [];
  return todos.map((todo: any) => ({
    ...todo,
    status: 'ARCHIVED'
  }));
}
