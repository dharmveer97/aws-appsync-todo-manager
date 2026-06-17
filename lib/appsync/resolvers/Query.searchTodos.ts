import type { Context, DynamoDBScanRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBScanRequest {
  const { limit = 20, nextToken, query } = ctx.arguments;

  const request: DynamoDBScanRequest = {
    operation: 'Scan',
    limit,
    nextToken
  };

  // Basic filter if query is provided
  if (query) {
    request.filter = {
      expression: 'contains(#title, :query) OR contains(#description, :query)',
      expressionNames: {
        '#title': 'title',
        '#description': 'description'
      },
      expressionValues: util.dynamodb.toMapValues({
        ':query': query
      })
    };
  }

  return request;
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return {
    items: ctx.result.items,
    nextToken: ctx.result.nextToken
  };
}
