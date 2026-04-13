import useSWR from 'swr';
import type { Todo, TodoConnection, CreateTodoInput, UpdateTodoInput, TodoFilterInput, UpdateOrderInput } from './types';

const API_URL = import.meta.env.VITE_APPSYNC_API_URL;
const API_KEY = import.meta.env.VITE_APPSYNC_API_KEY;

if (!API_URL || !API_KEY) {
  throw new Error('Missing VITE_APPSYNC_API_URL or VITE_APPSYNC_API_KEY in environment variables');
}

async function fetchGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
}

const todoFields = `
  id
  title
  subtitle
  description
  priority
  status
  category
  tags
  dueDate
  orderIndex
  completed
  owner
  createdAt
  updatedAt
`;

const LIST_TODOS_QUERY = `
  query ListTodos($limit: Int, $nextToken: String, $filter: TodoFilterInput) {
    listTodos(limit: $limit, nextToken: $nextToken, filter: $filter) {
      items {
        ${todoFields}
      }
      nextToken
    }
  }
`;

export function useTodos(limit: number = 10, filter?: TodoFilterInput) {
  const key = filter ? ['todos', limit, filter] : ['todos', limit];
  
  return useSWR<TodoConnection>(key, async () => {
    const data = await fetchGraphQL<{ listTodos: TodoConnection }>(LIST_TODOS_QUERY, { 
      limit, 
      filter 
    });
    return data.listTodos;
  }, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });
}

export async function getTodo(id: string): Promise<Todo | null> {
  const query = `
    query GetTodo($id: ID!) {
      getTodo(id: $id) {
        ${todoFields}
      }
    }
  `;
  
  const data = await fetchGraphQL<{ getTodo: Todo | null }>(query, { id });
  return data.getTodo;
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const query = `
    mutation CreateTodo($input: CreateTodoInput!) {
      createTodo(input: $input) {
        ${todoFields}
      }
    }
  `;
  
  const data = await fetchGraphQL<{ createTodo: Todo }>(query, { input });
  return data.createTodo;
}

export async function updateTodo(input: UpdateTodoInput): Promise<Todo> {
  const query = `
    mutation UpdateTodo($input: UpdateTodoInput!) {
      updateTodo(input: $input) {
        ${todoFields}
      }
    }
  `;
  
  const data = await fetchGraphQL<{ updateTodo: Todo }>(query, { input });
  return data.updateTodo;
}

export async function updateTodoOrder(input: UpdateOrderInput): Promise<Todo> {
  const query = `
    mutation UpdateTodoOrder($input: UpdateOrderInput!) {
      updateTodoOrder(input: $input) {
        ${todoFields}
      }
    }
  `;
  
  const data = await fetchGraphQL<{ updateTodoOrder: Todo }>(query, { input });
  return data.updateTodoOrder;
}

export async function reorderTodos(todos: UpdateOrderInput[]): Promise<Todo[]> {
  const query = `
    mutation ReorderTodos($todos: [UpdateOrderInput!]!) {
      reorderTodos(todos: $todos) {
        id
        orderIndex
        updatedAt
      }
    }
  `;
  
  const data = await fetchGraphQL<{ reorderTodos: Todo[] }>(query, { todos });
  return data.reorderTodos;
}

export async function deleteTodo(id: string): Promise<Todo | null> {
  const query = `
    mutation DeleteTodo($id: ID!) {
      deleteTodo(id: $id) {
        id
        title
      }
    }
  `;
  
  const data = await fetchGraphQL<{ deleteTodo: Todo | null }>(query, { id });
  return data.deleteTodo;
}

export async function deleteTodos(ids: string[]): Promise<Todo[]> {
  const query = `
    mutation DeleteTodos($ids: [ID!]!) {
      deleteTodos(ids: $ids) {
        id
        title
      }
    }
  `;
  
  const data = await fetchGraphQL<{ deleteTodos: Todo[] }>(query, { ids });
  return data.deleteTodos;
}

export const listTodos = async (
  limit: number = 10,
  nextToken?: string,
  filter?: TodoFilterInput
): Promise<TodoConnection> => {
  const data = await fetchGraphQL<{ listTodos: TodoConnection }>(LIST_TODOS_QUERY, { 
    limit, 
    nextToken, 
    filter 
  });
  return data.listTodos;
};

export function useSWRMutation<T, U>(
  key: string,
  fetcher: (data: U) => Promise<T>
) {
  const { mutate } = useSWR(key, null);
  
  return {
    trigger: async (data: U) => {
      const result = await fetcher(data);
      await mutate(result, false);
      return result;
    }
  };
}