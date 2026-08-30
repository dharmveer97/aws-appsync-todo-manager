import { util } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';
import type { Context, DynamoDBQueryRequest } from '@aws-appsync/utils';

export function request(ctx: Context): DynamoDBQueryRequest {
  const { limit = 20, nextToken, filter, query } = ctx.arguments;

  const filterConditions: Record<string, any>[] = [];

  if (filter) {
    if (filter.status && filter.status.length > 0) {
      filterConditions.push({
        status: { in: filter.status },
      });
    }

    if (filter.priority && filter.priority.length > 0) {
      filterConditions.push({
        priority: { in: filter.priority },
      });
    }

    if (filter.category && filter.category.length > 0) {
      filterConditions.push({
        category: { in: filter.category },
      });
    }

    if (filter.search) {
      filterConditions.push({
        or: [
          { title: { contains: filter.search } },
          { description: { contains: filter.search } },
          { subtitle: { contains: filter.search } },
        ],
      });
    }
  }

  // Support direct top-level query parameter (unifying searchTodos into listTodos)
  if (query) {
    filterConditions.push({
      or: [
        { title: { contains: query } },
        { description: { contains: query } },
        { subtitle: { contains: query } },
      ],
    });
  }

  let filterObj: any = undefined;
  if (filterConditions.length === 1) {
    filterObj = filterConditions[0];
  } else if (filterConditions.length > 1) {
    filterObj = { and: filterConditions };
  }

  return ddb.query({
    index: 'ActiveIndex',
    query: {
      activePartition: { eq: 'ALL_ACTIVE' },
    },
    scanIndexForward: false,
    limit,
    nextToken,
    filter: filterObj,
  });
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return {
    items: ctx.result.items,
    nextToken: ctx.result.nextToken,
  };
}
