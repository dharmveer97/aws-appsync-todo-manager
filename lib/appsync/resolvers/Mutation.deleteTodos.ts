import { Context, DynamoDBBatchDeleteItemRequest, util } from '@aws-appsync/utils';

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
  const { error, result } = ctx;

  if (error) {
    return util.error(error.message, error.type);
  }

  const deletedItems = result.Todos || [];
  
  return deletedItems.map((item: any) => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    priority: item.priority,
    status: item.status,
    completed: item.completed,
    owner: item.owner,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }));
}