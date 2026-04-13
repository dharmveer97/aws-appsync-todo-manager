import 'dotenv/config';
import type { Status, Priority } from './src/lib/types';

const API_URL = process.env.VITE_APPSYNC_API_URL!;
const API_KEY = process.env.VITE_APPSYNC_API_KEY!;

if (!API_URL || !API_KEY) {
  throw new Error(
    'Missing VITE_APPSYNC_API_URL or VITE_APPSYNC_API_KEY. Check frontend/.env file',
  );
}

const STATUSES: Status[] = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'ARCHIVED',
  'CANCELLED',
];
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

async function fetchGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
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

async function createTodoLocal(input: {
  title: string;
  subtitle?: string;
  description?: string;
  priority: Priority;
  status?: Status;
  dueDate?: string;
}): Promise<any> {
  const query = `
    mutation CreateTodo($input: CreateTodoInput!) {
      createTodo(input: $input) {
        id
        title
        status
        priority
        dueDate
      }
    }
  `;

  const data = await fetchGraphQL<{ createTodo: any }>(query, { input });
  return data.createTodo;
}

async function seedTodos() {
  const count = 40;

  console.log('Starting seed...');
  console.log(`API URL: ${API_URL}`);

  for (let i = 1; i <= count; i++) {
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30));
    const dueDate = futureDate.toISOString();

    try {
      const todo = await createTodoLocal({
        title: `Todo Item ${i}`,
        subtitle: `Subtitle for item ${i}`,
        description: `Description for todo item ${i}`,
        priority,
        status,
        dueDate,
      });
      console.log(
        `Created: ${todo.id} - ${todo.title} (${todo.status}/${todo.priority})`,
      );
    } catch (error) {
      console.error(`Failed to create todo ${i}:`, error);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`\nSuccessfully seeded ${count} todos!`);
}

seedTodos();
