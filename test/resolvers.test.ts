// Mock AppSync runtime utilities for Node.js Jest test environment
jest.mock('@aws-appsync/utils', () => ({
  util: {
    autoId: () => 'auto-id-1234',
    time: {
      nowISO8601: () => '2026-08-30T18:00:00.000Z',
      nowEpochMilliSeconds: () => 1788111600000,
    },
    error: (msg: string, type: string) => {
      const err = new Error(msg);
      (err as any).type = type;
      throw err;
    },
    dynamodb: {
      toMapValues: (obj: any) => obj,
    },
  },
}));

jest.mock('@aws-appsync/utils/dynamodb', () => ({
  get: (payload: any) => ({ operation: 'GetItem', ...payload }),
  put: (payload: any) => ({ operation: 'PutItem', ...payload }),
  update: (payload: any) => ({ operation: 'UpdateItem', ...payload }),
  remove: (payload: any) => ({ operation: 'DeleteItem', ...payload }),
  query: (payload: any) => ({ operation: 'Query', ...payload }),
  transactWrite: (payload: any) => ({ operation: 'TransactWriteItems', transactItems: payload.items }),
  operations: {
    remove: () => ({ _type: 'remove' }),
    increment: (by = 1) => ({ _type: 'increment', by }),
    decrement: (by = 1) => ({ _type: 'decrement', by }),
    replace: (payload: any) => ({ _type: 'replace', payload }),
    add: (payload: any) => ({ _type: 'add', payload }),
  },
}));

import * as QueryGetTodo from '../lib/appsync/resolvers/Query.getTodo';
import * as QueryGetStats from '../lib/appsync/resolvers/Query.getStats';
import * as QueryListTodos from '../lib/appsync/resolvers/Query.listTodos';
import * as MutationCreateTodo from '../lib/appsync/resolvers/Mutation.createTodo';
import * as MutationUpdateTodo from '../lib/appsync/resolvers/Mutation.updateTodo';
import * as MutationUpdateTodoOrder from '../lib/appsync/resolvers/Mutation.updateTodoOrder';
import * as MutationReorderTodos from '../lib/appsync/resolvers/Mutation.reorderTodos';
import * as MutationDeleteTodo from '../lib/appsync/resolvers/Mutation.deleteTodo';
import * as MutationDeleteTodos from '../lib/appsync/resolvers/Mutation.deleteTodos';

describe('AppSync JS Resolvers - Unified Architecture Tests', () => {

  test('1. Query.getTodo resolver (ddb.get)', () => {
    const ctx: any = { arguments: { id: 'todo-123' }, result: { id: 'todo-123', title: 'Test Todo', status: 'PENDING' } };
    const req: any = QueryGetTodo.request(ctx);
    expect(req.operation).toBe('GetItem');
    expect(req.key).toEqual({ id: 'todo-123' });

    const res = QueryGetTodo.response(ctx);
    expect(res).toEqual({ id: 'todo-123', title: 'Test Todo', status: 'PENDING' });

    const archivedCtx: any = { arguments: { id: 'todo-123' }, result: { id: 'todo-123', status: 'ARCHIVED' } };
    expect(QueryGetTodo.response(archivedCtx)).toBeNull();
  });

  test('2. Query.getStats resolver (ddb.get)', () => {
    const ctx: any = { arguments: { id: 'todos_count' }, result: { id: 'todos_count', count: 42 } };
    const req: any = QueryGetStats.request(ctx);
    expect(req.operation).toBe('GetItem');
    expect(req.key).toEqual({ id: 'todos_count' });
    expect(QueryGetStats.response(ctx)).toEqual({ id: 'todos_count', count: 42 });
  });

  test('3. Query.listTodos resolver (Zero-Scan, GSI ActiveIndex ddb.query with filters)', () => {
    const ctx: any = {
      arguments: {
        limit: 10,
        filter: {
          priority: ['HIGH', 'URGENT'],
          status: ['PENDING']
        }
      },
      result: { items: [{ id: '1' }], nextToken: 'token123' }
    };
    const req: any = QueryListTodos.request(ctx);
    expect(req.operation).toBe('Query');
    expect(req.index).toBe('ActiveIndex');
    expect(req.limit).toBe(10);
    expect(req.scanIndexForward).toBe(false);
    expect(req.query).toEqual({ activePartition: { eq: 'ALL_ACTIVE' } });
    expect(req.filter).toBeDefined();

    const res = QueryListTodos.response(ctx);
    expect(res).toEqual({ items: [{ id: '1' }], nextToken: 'token123' });
  });

  test('4. Unified Query.listTodos handling search query (Zero-Scan)', () => {
    const ctx: any = {
      arguments: {
        query: 'Marketing',
        limit: 15
      },
      result: { items: [{ id: '2' }], nextToken: null }
    };
    const req: any = QueryListTodos.request(ctx);
    expect(req.operation).toBe('Query');
    expect(req.index).toBe('ActiveIndex');
    expect(req.limit).toBe(15);
    expect(req.scanIndexForward).toBe(false);
    expect(req.query).toEqual({ activePartition: { eq: 'ALL_ACTIVE' } });
    expect(req.filter).toEqual({
      or: [
        { title: { contains: 'Marketing' } },
        { description: { contains: 'Marketing' } },
        { subtitle: { contains: 'Marketing' } }
      ]
    });

    const res = QueryListTodos.response(ctx);
    expect(res).toEqual({ items: [{ id: '2' }], nextToken: null });
  });

  test('5. Mutation.createTodo resolver (ddb.transactWrite)', () => {
    const ctx: any = {
      arguments: {
        input: {
          title: 'Deploy to Prod',
          priority: 'URGENT',
          status: 'PENDING'
        }
      },
      stash: {}
    };
    const req: any = MutationCreateTodo.request(ctx);
    expect(req.operation).toBe('TransactWriteItems');
    expect(req.transactItems.length).toBe(2);
    expect(req.transactItems[0].putItem.table).toBe('Todos');
    expect(req.transactItems[1].updateItem.table).toBe('Stats');
    expect(ctx.stash.todo.title).toBe('Deploy to Prod');
    expect(ctx.stash.todo.activePartition).toBe('ALL_ACTIVE');

    const res = MutationCreateTodo.response(ctx);
    expect(res.title).toBe('Deploy to Prod');
  });

  test('6. Mutation.updateTodo resolver (ddb.update)', () => {
    const ctx: any = {
      arguments: {
        input: {
          id: 'todo-123',
          status: 'ARCHIVED'
        }
      },
      result: { id: 'todo-123', status: 'ARCHIVED' }
    };
    const req: any = MutationUpdateTodo.request(ctx);
    expect(req.operation).toBe('UpdateItem');
    expect(req.key).toEqual({ id: 'todo-123' });
    expect(req.update.status).toBe('ARCHIVED');
    expect(req.update.activePartition).toEqual({ _type: 'remove' });

    const res = MutationUpdateTodo.response(ctx);
    expect(res.status).toBe('ARCHIVED');
  });

  test('7. Mutation.updateTodoOrder resolver (Modern ddb.update)', () => {
    const ctx: any = {
      arguments: {
        input: {
          id: 'todo-123',
          orderIndex: 999
        }
      },
      result: { id: 'todo-123', orderIndex: 999 }
    };
    const req: any = MutationUpdateTodoOrder.request(ctx);
    expect(req.operation).toBe('UpdateItem');
    expect(req.key).toEqual({ id: 'todo-123' });
    expect(req.update.orderIndex).toBe(999);

    const res = MutationUpdateTodoOrder.response(ctx);
    expect(res.orderIndex).toBe(999);
  });

  test('8. Mutation.reorderTodos resolver (Modern ddb.transactWrite)', () => {
    const ctx: any = {
      arguments: {
        todos: [
          { id: 'todo-1', orderIndex: 100 },
          { id: 'todo-2', orderIndex: 200 }
        ]
      }
    };
    const req: any = MutationReorderTodos.request(ctx);
    expect(req.operation).toBe('TransactWriteItems');
    expect(req.transactItems.length).toBe(2);
    expect(req.transactItems[0].updateItem.table).toBe('Todos');
    expect(req.transactItems[0].updateItem.key).toEqual({ id: 'todo-1' });

    const res = MutationReorderTodos.response(ctx);
    expect(res.length).toBe(2);
    expect(res[0].id).toBe('todo-1');
  });

  test('9. Mutation.deleteTodo resolver (Atomic Soft-Delete ddb.transactWrite)', () => {
    const ctx: any = {
      arguments: { id: 'todo-123' }
    };
    const req: any = MutationDeleteTodo.request(ctx);
    expect(req.operation).toBe('TransactWriteItems');
    expect(req.transactItems.length).toBe(2);
    expect(req.transactItems[0].updateItem.table).toBe('Todos');
    expect(req.transactItems[0].updateItem.update.status).toBe('ARCHIVED');
    expect(req.transactItems[1].updateItem.table).toBe('Stats');

    const res = MutationDeleteTodo.response(ctx);
    expect(res).toEqual({ id: 'todo-123', status: 'ARCHIVED' });
  });

  test('10. Mutation.deleteTodos resolver (Batch Atomic Soft-Delete ddb.transactWrite)', () => {
    const ctx: any = {
      arguments: { ids: ['todo-1', 'todo-2', 'todo-3'] }
    };
    const req: any = MutationDeleteTodos.request(ctx);
    expect(req.operation).toBe('TransactWriteItems');
    expect(req.transactItems.length).toBe(4); // 3 Todos + 1 Stats
    expect(req.transactItems[0].updateItem.table).toBe('Todos');
    expect(req.transactItems[0].updateItem.key).toEqual({ id: 'todo-1' });
    expect(req.transactItems[3].updateItem.table).toBe('Stats');

    const res = MutationDeleteTodos.response(ctx);
    expect(res.length).toBe(3);
    expect(res[0].status).toBe('ARCHIVED');
  });
});
