import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import crypto from 'crypto';

const ddbRawClient = new DynamoDBClient({
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

const ddb = DynamoDBDocumentClient.from(ddbRawClient, {
  marshallOptions: { removeUndefinedValues: true },
});

function flokiGraphQLPlugin() {
  return {
    name: 'floki-graphql-bridge',
    configureServer(server: any) {
      server.middlewares.use('/api/graphql', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const { query, variables } = JSON.parse(body || '{}');
            const cleanQuery = query ? query.trim() : '';

            // Handle getStats
            if (cleanQuery.includes('getStats')) {
              const scanRes = await ddb.send(
                new ScanCommand({ TableName: 'Todos' })
              );
              const items = scanRes.Items || [];
              const activeCount = items.filter((i: any) => i.status !== 'ARCHIVED').length;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  data: {
                    getStats: {
                      id: variables?.id || 'todos_count',
                      count: activeCount,
                    },
                  },
                })
              );
              return;
            }

            // Handle listTodos and searchTodos
            if (cleanQuery.includes('listTodos') || cleanQuery.includes('searchTodos')) {
              const scanRes = await ddb.send(
                new ScanCommand({ TableName: 'Todos' })
              );
              let items = scanRes.Items || [];

              const filter = variables?.filter;
              const queryParam = variables?.query;

              // Soft-Delete Default Rule (Sparse Index):
              // If status is not explicitly queried in the filter, exclude ARCHIVED items
              if (filter && filter.status && filter.status.length > 0) {
                items = items.filter((item: any) =>
                  filter.status.includes(item.status)
                );
              } else {
                // Default: Active partition only (no ARCHIVED)
                items = items.filter((item: any) => item.status !== 'ARCHIVED');
              }

              // Multi-Filter: Priority (OR within array, AND with others)
              if (filter?.priority && filter.priority.length > 0) {
                items = items.filter((item: any) =>
                  filter.priority.includes(item.priority)
                );
              }

              // Multi-Filter: Category (OR within array, AND with others)
              if (filter?.category && filter.category.length > 0) {
                items = items.filter((item: any) =>
                  filter.category.includes(item.category)
                );
              }

              // Filter / Search: Title, Subtitle, Description
              const searchTerm = (filter?.search || queryParam || '').trim().toLowerCase();
              if (searchTerm) {
                items = items.filter((item: any) => {
                  const t = (item.title || '').toLowerCase();
                  const s = (item.subtitle || '').toLowerCase();
                  const d = (item.description || '').toLowerCase();
                  return t.includes(searchTerm) || s.includes(searchTerm) || d.includes(searchTerm);
                });
              }

              // Filter: Overdue
              if (filter?.overdue) {
                const now = new Date().toISOString();
                items = items.filter(
                  (item: any) =>
                    item.dueDate &&
                    item.dueDate < now &&
                    item.status !== 'COMPLETED' &&
                    item.status !== 'CANCELLED' &&
                    item.status !== 'ARCHIVED'
                );
              }

              // Sort by orderIndex or createdAt descending
              items.sort(
                (a: any, b: any) =>
                  (b.orderIndex ?? 0) - (a.orderIndex ?? 0)
              );

              // Pagination offset handling
              let offset = 0;
              if (variables?.nextToken) {
                try {
                  const decoded = JSON.parse(
                    Buffer.from(variables.nextToken, 'base64').toString('utf-8')
                  );
                  if (typeof decoded.offset === 'number') {
                    offset = decoded.offset;
                  }
                } catch {
                  offset = 0;
                }
              }

              const limit = variables?.limit ? Number(variables.limit) : 10;
              const paginatedItems = items.slice(offset, offset + limit);
              const hasMore = offset + limit < items.length;
              const nextToken = hasMore
                ? Buffer.from(JSON.stringify({ offset: offset + limit })).toString('base64')
                : null;

              const responseField = cleanQuery.includes('searchTodos')
                ? 'searchTodos'
                : 'listTodos';

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  data: {
                    [responseField]: {
                      items: paginatedItems,
                      nextToken,
                    },
                  },
                })
              );
              return;
            }

            // Handle getTodo
            if (cleanQuery.includes('getTodo')) {
              const id = variables?.id;
              const getRes = await ddb.send(
                new GetCommand({ TableName: 'Todos', Key: { id } })
              );
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  data: {
                    getTodo: getRes.Item || null,
                  },
                })
              );
              return;
            }

            // Handle createTodo
            if (cleanQuery.includes('createTodo')) {
              let input = variables?.input;
              if (!input) {
                const match = cleanQuery.match(/createTodo\s*\(\s*input\s*:\s*\{([^}]+)\}/);
                input = {};
                if (match && match[1]) {
                  const parts = match[1].split(',');
                  for (const part of parts) {
                    const [k, ...v] = part.split(':');
                    if (k && v.length > 0) {
                      const key = k.trim();
                      const val = v.join(':').trim().replace(/^"|"$/g, '');
                      input[key] = val;
                    }
                  }
                }
              }
              const id = input?.id || `todo-${crypto.randomUUID().slice(0, 8)}`;
              const now = new Date().toISOString();
              const status = input?.status || 'PENDING';
              const newTodo: Record<string, any> = {
                id,
                title: input?.title || 'Untitled Todo',
                subtitle: input?.subtitle || '',
                description: input?.description || '',
                priority: input?.priority || 'MEDIUM',
                status,
                category: input?.category || 'WORK',
                completed: input?.completed === 'true' || input?.completed === true || false,
                tags: Array.isArray(input?.tags) ? input.tags : [],
                dueDate: input?.dueDate || null,
                owner: 'user-dharam',
                createdAt: now,
                updatedAt: now,
                orderIndex: input?.orderIndex ? Number(input.orderIndex) : Date.now(),
              };

              if (status !== 'ARCHIVED') {
                newTodo.activePartition = 'ALL_ACTIVE';
              }

              await ddb.send(
                new PutCommand({
                  TableName: 'Todos',
                  Item: newTodo,
                })
              );

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  data: {
                    createTodo: newTodo,
                  },
                })
              );
              return;
            }

            // Handle updateTodo
            if (cleanQuery.includes('updateTodo') && !cleanQuery.includes('updateTodoOrder')) {
              const input = variables?.input || {};
              const id = input.id;
              const existing = await ddb.send(
                new GetCommand({ TableName: 'Todos', Key: { id } })
              );
              const existingItem = existing.Item || {};
              const newStatus = input.status || existingItem.status;

              const updated: Record<string, any> = {
                ...existingItem,
                ...input,
                updatedAt: new Date().toISOString(),
              };

              if (newStatus === 'ARCHIVED') {
                delete updated.activePartition;
              } else {
                updated.activePartition = 'ALL_ACTIVE';
              }

              await ddb.send(
                new PutCommand({
                  TableName: 'Todos',
                  Item: updated,
                })
              );

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  data: {
                    updateTodo: updated,
                  },
                })
              );
              return;
            }

            // Handle updateTodoOrder
            if (cleanQuery.includes('updateTodoOrder')) {
              const input = variables?.input || {};
              const id = input.id;
              const existing = await ddb.send(
                new GetCommand({ TableName: 'Todos', Key: { id } })
              );
              const updated = {
                ...(existing.Item || {}),
                orderIndex: input.orderIndex,
                updatedAt: new Date().toISOString(),
              };

              await ddb.send(
                new PutCommand({
                  TableName: 'Todos',
                  Item: updated,
                })
              );

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  data: {
                    updateTodoOrder: updated,
                  },
                })
              );
              return;
            }

            // Handle reorderTodos
            if (cleanQuery.includes('reorderTodos')) {
              const todosList = variables?.todos || [];
              const updatedList: any[] = [];
              for (const item of todosList) {
                const existing = await ddb.send(
                  new GetCommand({ TableName: 'Todos', Key: { id: item.id } })
                );
                const updated = {
                  ...(existing.Item || {}),
                  orderIndex: item.orderIndex,
                  updatedAt: new Date().toISOString(),
                };
                await ddb.send(
                  new PutCommand({
                    TableName: 'Todos',
                    Item: updated,
                  })
                );
                updatedList.push(updated);
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  data: {
                    reorderTodos: updatedList,
                  },
                })
              );
              return;
            }

            // Handle deleteTodo (Soft Delete to ARCHIVED)
            if (cleanQuery.includes('deleteTodo') && !cleanQuery.includes('deleteTodos')) {
              const id = variables?.id;
              const existing = await ddb.send(
                new GetCommand({ TableName: 'Todos', Key: { id } })
              );
              const updated = {
                ...(existing.Item || {}),
                status: 'ARCHIVED',
                updatedAt: new Date().toISOString(),
              };
              delete updated.activePartition;

              await ddb.send(
                new PutCommand({
                  TableName: 'Todos',
                  Item: updated,
                })
              );

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  data: {
                    deleteTodo: { id, title: 'Archived', status: 'ARCHIVED' },
                  },
                })
              );
              return;
            }

            // Handle deleteTodos (Soft Delete multiple items to ARCHIVED)
            if (cleanQuery.includes('deleteTodos')) {
              const ids = variables?.ids || [];
              for (const id of ids) {
                const existing = await ddb.send(
                  new GetCommand({ TableName: 'Todos', Key: { id } })
                );
                const updated = {
                  ...(existing.Item || {}),
                  status: 'ARCHIVED',
                  updatedAt: new Date().toISOString(),
                };
                delete updated.activePartition;

                await ddb.send(
                  new PutCommand({
                    TableName: 'Todos',
                    Item: updated,
                  })
                );
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  data: {
                    deleteTodos: ids.map((id: string) => ({ id, title: 'Archived', status: 'ARCHIVED' })),
                  },
                })
              );
              return;
            }

            // Default fallback
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ data: null }));
          } catch (err: any) {
            console.error('GraphQL Dev Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ errors: [{ message: err.message }] }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), flokiGraphQLPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});