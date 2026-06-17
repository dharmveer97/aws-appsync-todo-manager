import { util } from '@aws-appsync/utils';
import type { Context, DynamoDBQueryRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBQueryRequest {
  const { limit = 20, nextToken, filter } = ctx.arguments;

  const queryRequest: DynamoDBQueryRequest = {
    operation: 'Query',
    index: 'ActiveIndex',
    query: {
      expression: 'activePartition = :activePartition',
      expressionValues: {
        ':activePartition': { S: 'ALL_ACTIVE' }
      }
    },
    scanIndexForward: false,
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

    if (filter.category && filter.category.length > 0) {
      expressionNames['#category'] = 'category';
      const categoryValues = filter.category.map((c: string, i: number) => {
        const key = `:category${i}`;
        expressionValues[key] = c;
        return key;
      });
      filters.push(`#category IN (${categoryValues.join(', ')})`);
    }

    if (filter.search) {
      expressionNames['#title'] = 'title';
      expressionNames['#description'] = 'description';
      expressionValues[':search'] = filter.search;
      filters.push('(contains(#title, :search) OR contains(#description, :search))');
    }

    if (filters.length > 0) {
      queryRequest.filter = {
        expression: filters.join(' AND '),
        expressionNames,
        expressionValues: util.dynamodb.toMapValues(expressionValues)
      };
    }
  }

  return queryRequest;
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
