import { Context, DynamoDBScanRequest, util } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBScanRequest {
  const { limit = 20, nextToken, filter } = ctx.arguments;

  const request: DynamoDBScanRequest = {
    operation: 'Scan',
    limit,
    nextToken
  };

  if (filter && (filter.status || filter.priority)) {
    const filters: string[] = [];
    const expressionValues: Record<string, any> = {};
    const expressionNames: Record<string, string> = {};

    if (filter.status && filter.status.length > 0) {
      filters.push('#status IN :statusValues');
      expressionNames['#status'] = 'status';
      expressionValues[':statusValues'] = filter.status;
    }

    if (filter.priority && filter.priority.length > 0) {
      filters.push('#priority IN :priorityValues');
      expressionNames['#priority'] = 'priority';
      expressionValues[':priorityValues'] = filter.priority;
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
  const { error, result } = ctx;

  if (error) {
    return util.error(error.message, error.type);
  }

  return {
    items: result.items,
    nextToken: result.nextToken
  };
}
