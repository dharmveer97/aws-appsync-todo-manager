# Todo Management Frontend

React + TypeScript + Vite frontend for AWS AppSync Todo API.

## Features

- 📋 CRUD operations for todos
- 🔍 Filter by Status & Priority  
- 📊 Pagination (10 items/page)
- ✅ Bulk selection & delete
- 🎨 Tailwind CSS + shadcn/ui

## Setup

```bash
npm install
cp .env.example .env  # Add your API URL/key
npm run dev           # Start at localhost:3000
```

## Environment Variables

| Variable | Required |
|----------|----------|
| `VITE_APPSYNC_API_URL` | Yes |
| `VITE_APPSYNC_API_KEY` | Yes |

## Scripts

```bash
npm run dev        # Development server
npm run build      # Production build
npm run seed       # Add 40 test todos
npm run typecheck  # Type check
```

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn components
│   ├── operations/   # CRUD components
│   ├── pages/        # TodoPage
├── lib/
│   ├── api.ts        # GraphQL client
│   ├── types.ts      # TypeScript types
│   ├── utils.ts      # Utilities
```

See main [README](../README.md) for full documentation.