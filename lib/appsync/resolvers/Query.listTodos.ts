import type { Context, DynamoDBScanRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBScanRequest {
  const { limit = 20, nextToken, filter } = ctx.arguments;

  const request: DynamoDBScanRequest = {
    operation: 'Scan',
    limit,
    nextToken
  };

  if (filter) {
    const filters: string[] = [];
    const expressionValues: Record<string, any> = {};
    const expressionNames: Record<string, string> = {};

    if (filter.status && filter.status.length > 0) {
      expressionNames['#status'] = 'status';
      const statusValues = filter.status.map((s: string, i: number) => {
        const key = `:status${i}`;
        expressionValues[key] = s;
        return key;
      });
      filters.push(`#status IN (${statusValues.join(', ')})`);
    }

    if (filter.priority && filter.priority.length > 0) {
      expressionNames['#priority'] = 'priority';
      const priorityValues = filter.priority.map((p: string, i: number) => {
        const key = `:priority${i}`;
        expressionValues[key] = p;
        return key;
      });
      filters.push(`#priority IN (${priorityValues.join(', ')})`);
    }

    if (filters.length > 0) {
      request.filter = {
        expression: filters.join(' AND '),
        expressionNames,
        expressionValues: util.dynamodb.toMapValues(expressionValues)
      };
    }
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
