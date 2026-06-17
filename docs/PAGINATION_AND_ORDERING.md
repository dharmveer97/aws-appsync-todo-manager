# Todo Pagination and Custom Ordering System

This document explains the architecture, design decisions, and code changes made to implement **soft-delete**, **non-collapsing pagination**, and **custom task ordering** in this project.

---

## 1. Non-Collapsing Pagination (Sparse GSI Pattern)

### The Problem
If we delete items from a table and filter them out using a standard filter expression (e.g. `status != 'ARCHIVED'`), DynamoDB applies page limits *before* filtering. 
* **Example:** With a page size of 4, if 3 items on page 1 are archived, DynamoDB reads those 4 items, filters out the 3 archived ones, and returns only 1 item to the user. This causes the page size to "collapse" unevenly, showing 1, 4, 4 items across pages, which looks buggy.

### The Solution: Sparse GSI
We added a Global Secondary Index (GSI) called `ActiveIndex`:
* **Partition Key:** `activePartition` (type: `STRING`)
* **Sort Key:** `createdAt` (type: `STRING`)

**How it works:**
1. When a task is active (e.g., status is `PENDING`, `IN_PROGRESS`, etc.), we set its `activePartition = 'ALL_ACTIVE'`.
2. When a task is soft-deleted/archived (`status = 'ARCHIVED'`), we **remove** the `activePartition` attribute from the item.
3. Because DynamoDB GSIs are **sparse**, items missing the GSI partition key are **never indexed**.
4. When querying active tasks, we query `ActiveIndex` where `activePartition = 'ALL_ACTIVE'`.
5. DynamoDB only returns active tasks. Pagination page sizes never collapse (e.g. they remain consistently filled as 4, 4, 4).

---

## 2. Automated Custom Ordering (`orderIndex`)

To sort tasks by their creation order automatically, each todo item is assigned an `orderIndex`.

### The Code
In [Mutation.createTodo.ts](file:///Users/dharamveerbangar/Projects/aws-appsync-todo-manager/lib/appsync/resolvers/Mutation.createTodo.ts):
```typescript
orderIndex: Math.floor(util.time.nowEpochMilliSeconds() / 1000)
```

### Simple Explanation (Step-by-Step)
1. **`util.time.nowEpochMilliSeconds()`**: Gets the current time in **milliseconds** since Jan 1, 1970 (e.g., `1781700000550`).
2. **`/ 1000`**: Divides by 1000 to convert milliseconds into **seconds** (e.g., `1781700000.550`).
3. **`Math.floor(...)`**: Removes the decimal points by rounding down to the nearest whole integer (e.g., `1781700000`).

### Practical Example
* **Task A** is created at 12:00:00.550 PM $\rightarrow$ receives `orderIndex = 1781700000`.
* **Task B** is created 5 minutes later at 12:05:00.220 PM $\rightarrow$ receives `orderIndex = 1781700300` (a larger number).
* Because the database sorts numbers ascendingly, Task A stays at the top, and Task B is placed after it. 

The frontend does **not** need to find the order of the last added item or pass any `orderIndex` when creating a task; it is **100% automated on the backend**.

---

## 3. Scalability with Millions of Items

### Where it is Effective:
* **Querying & Paginating**: Even with millions of items, querying the first page of sorted tasks is extremely fast (`O(1)` complexity). The items are pre-sorted on disk inside the GSI, so the database doesn't perform sort operations at query time.

### Scale Bottlenecks & Improvements:
If the database grows to millions of items, two main challenges occur:

1. **GSI Hot Partitioning**:
   * *Problem:* All active items share the same partition key value (`activePartition = 'ALL_ACTIVE'`). Under extremely high traffic, writing to a single partition key value in a GSI can cause DynamoDB write throttling.
   * *Improvement:* Use a composite key like `owner#status` (e.g., `user123#PENDING`) as the GSI partition key so data is split across millions of user partitions instead of one.
2. **Reordering visible items**:
   * *Problem:* Currently, drag-and-drop reordering updates the `orderIndex` of **all items** visible on the screen one by one.
   * *Improvement:* Implement **Fractional Indexing** (using floats/doubles). When moving an item between index `10.0` and `11.0`, set its index to `10.5` and update **only that one item** in the database.

---

## 4. Code Changes Made

### Backend (CDK & Resolvers)
* [appsync-stack.ts](file:///Users/dharamveerbangar/Projects/aws-appsync-todo-manager/lib/appsync-stack.ts): Defined the GSIs (including `ActiveIndex`) and registered resolvers.
* [Query.listTodos.ts](file:///Users/dharamveerbangar/Projects/aws-appsync-todo-manager/lib/appsync/resolvers/Query.listTodos.ts): Swapped scan queries for a GSI Query matching the active partition.
* [Query.getTodo.ts](file:///Users/dharamveerbangar/Projects/aws-appsync-todo-manager/lib/appsync/resolvers/Query.getTodo.ts): Returns null if the item status is archived.
* [Mutation.createTodo.ts](file:///Users/dharamveerbangar/Projects/aws-appsync-todo-manager/lib/appsync/resolvers/Mutation.createTodo.ts): Automatically adds `activePartition = 'ALL_ACTIVE'` and generates `orderIndex` timestamp.
* [Mutation.updateTodo.ts](file:///Users/dharamveerbangar/Projects/aws-appsync-todo-manager/lib/appsync/resolvers/Mutation.updateTodo.ts): Safely manages adding/removing `activePartition` on status updates.
* [Mutation.deleteTodo.ts](file:///Users/dharamveerbangar/Projects/aws-appsync-todo-manager/lib/appsync/resolvers/Mutation.deleteTodo.ts): Sets status to `ARCHIVED` and removes `activePartition` attribute.
* [Mutation.deleteTodosUpdate.ts](file:///Users/dharamveerbangar/Projects/aws-appsync-todo-manager/lib/appsync/resolvers/Mutation.deleteTodosUpdate.ts): Batch-archives multiple tasks.

### Frontend
* [TodoPage.tsx](file:///Users/dharamveerbangar/Projects/aws-appsync-todo-manager/frontend/src/components/pages/TodoPage.tsx):
  * Replaced buggy pagination state tracking with clean `currentToken` and `prevTokens` stack navigation.
  * Corrected next/previous click actions.
  * Ensured add/delete/reorder actions reload the current page using `currentToken`.
