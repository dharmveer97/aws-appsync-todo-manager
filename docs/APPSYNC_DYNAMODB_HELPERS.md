# AWS AppSync DynamoDB Helpers Guide

This guide explains how to use the built-in DynamoDB utility methods provided by `@aws-appsync/utils`. Using these helper methods is much better than writing raw database JSON manually.

---

## 1. Why use these helpers?
1. **No manual mapping:** You don't need to write expressions (like `SET #a = :a`), attribute names, or attribute values manually.
2. **Type Safety:** The TypeScript compiler checks your keys and values. This catches typos at compile time instead of failing at runtime.
3. **Short and Clean:** It reduces 20 lines of raw JSON mapping to 5 lines of simple Javascript.

---

## 2. Core Operations (`import * as ddb from '@aws-appsync/utils/dynamodb'`)

These are the primary methods used to generate request payloads inside resolver `request` functions.

### `ddb.get({ key })`
* **When to use:** Retrieve a single item by its primary key.
* **Example:**
  ```typescript
  return ddb.get({
    key: { id: ctx.args.id }
  });
  ```

### `ddb.put({ key, item, condition })`
* **When to use:** Create a new item or completely overwrite an existing item.
* **Example:**
  ```typescript
  return ddb.put({
    key: { id: util.autoId() },
    item: {
      title: ctx.args.title,
      status: 'PENDING'
    }
  });
  ```

### `ddb.update({ key, update, condition })`
* **When to use:** Update specific fields on an item without overwriting the whole item.
* **Example:**
  ```typescript
  return ddb.update({
    key: { id: ctx.args.id },
    update: {
      status: 'COMPLETED',
      updatedAt: util.time.nowISO8601()
    }
  });
  ```

### `ddb.remove({ key, condition })`
* **When to use:** Delete an item permanently from the database.
* **Example:**
  ```typescript
  return ddb.remove({
    key: { id: ctx.args.id }
  });
  ```

### `ddb.query({ query, index, limit, nextToken, scanIndexForward, filter })`
* **When to use:** Retrieve multiple items that share the same partition key (and optionally filter/sort them). Highly efficient.
* **Example:**
  ```typescript
  return ddb.query({
    index: 'ActiveIndex',
    query: {
      activePartition: { eq: 'ALL_ACTIVE' }
    },
    limit: 10
  });
  ```

### `ddb.scan({ limit, nextToken, filter })`
* **When to use:** Retrieve items by scanning the entire table.
* **Warning:** Extremely slow and expensive for large tables. Avoid scans whenever possible.
* **Example:**
  ```typescript
  return ddb.scan({ limit: 20 });
  ```

---

## 3. Update Modifiers (`ddb.operations`)

Use these helper methods inside the `update` object of `ddb.update()` to perform advanced mutations.

### `ddb.operations.remove()`
* **When to use:** Completely delete an attribute/column from an item.
* **Example:**
  ```typescript
  update: {
    activePartition: ddb.operations.remove() // Removes the column from the item
  }
  ```

### `ddb.operations.increment(by?)` / `ddb.operations.decrement(by?)`
* **When to use:** Tracking counters like page views, login retries, user likes, or item stock directly in the database.
* **Why it is recommended & Price-Friendly:**
  * **Saves Money:** It is an atomic database update that uses only **1 Write operation**. A manual read-then-write pattern costs 2 operations (1 Read + 1 Write).
  * **Prevents Race Conditions:** If two users click a button at the same millisecond, DynamoDB handles it safely and adds both. A manual read-then-write would overwrite one of the clicks.

* **Example:**
  ```typescript
  update: {
    viewsCount: ddb.operations.increment(1),
    retriesLeft: ddb.operations.decrement(1)
  }
  ```

### `ddb.operations.append(list)` / `ddb.operations.prepend(list)`
* **When to use:** Add items to the end or the beginning of a list array field.
* **Example:**
  ```typescript
  update: {
    tags: ddb.operations.append(['React', 'AWS'])
  }
  ```

### `ddb.operations.replace(payload)`
* **When to use:** Replace a sub-object or nested attribute completely.
* **Example:**
  ```typescript
  update: {
    address: ddb.operations.replace({ city: 'New York', zip: '10001' })
  }
  ```

---

## 4. Batch and Transactional Helpers

Use these when performing multiple operations at once.

### Batch Operations
* **`ddb.batchGet`**: Read up to 100 items from one or more tables in a single request.
* **`ddb.batchPut`**: Create/overwrite multiple items across tables.
* **`ddb.batchDelete`**: Delete multiple items.
* **Example (`batchPut`):**
  ```typescript
  return ddb.batchPut({
    tables: {
      Todos: [
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' }
      ]
    }
  });
  ```

### Transaction Operations
Transactions guarantee that all operations succeed or all fail together (ACID).
* **`ddb.transactGet`**: Atomically retrieve multiple items.
* **`ddb.transactWrite`**: Atomically write, update, delete, or check conditions across multiple items.
* **Example (`transactWrite`):**
  ```typescript
  return ddb.transactWrite({
    items: [
      { putItem: { table: 'Todos', key: { id: '1' }, item: { title: 'Task 1' } } },
      { deleteItem: { table: 'Todos', key: { id: '2' } } }
    ]
  });
  ```

---

## 5. Type Conversions (`util.dynamodb`)

DynamoDB requires values to be explicitly typed (e.g. `{"title": {"S": "Task 1"}}`). These helpers handle the conversions.

### `util.dynamodb.toMapValues(object)`
* **When to use:** Converts a standard Javascript object into a DynamoDB typed attribute map. Used in manual requests or inserts.
* **Example:**
  ```typescript
  util.dynamodb.toMapValues({ name: 'John', age: 30 })
  // Returns: { name: { S: 'John' }, age: { N: '30' } }
  ```

### `util.dynamodb.toDynamoDB(value)`
* **When to use:** Convert any raw Javascript variable (string, number, array, boolean) into its typed DynamoDB JSON.
* **Example:**
  ```typescript
  util.dynamodb.toDynamoDB("hello") // Returns: { S: "hello" }
  util.dynamodb.toDynamoDB(123)     // Returns: { N: 123 }
  util.dynamodb.toDynamoDB(true)    // Returns: { BOOL: true }
  ```

### Specific Type Converters
* **`util.dynamodb.toString(val)`** $\rightarrow$ returns `{ S: val }`
* **`util.dynamodb.toNumber(val)`** $\rightarrow$ returns `{ N: val }`
* **`util.dynamodb.toBoolean(val)`** $\rightarrow$ returns `{ BOOL: val }`
* **`util.dynamodb.toList(array)`** $\rightarrow$ returns `{ L: [...] }`
* **`util.dynamodb.toMap(object)`** $\rightarrow$ returns `{ M: {...} }`

---

## 6. Dynamic Filter Generation (`util.transform`)

### `util.transform.toDynamoDBFilterExpression(filterObject)`
* **When to use:** Dynamically generates a DynamoDB filter expression string with name/value mapping arrays from a filter object.
* **Example:**
  ```typescript
  util.transform.toDynamoDBFilterExpression({
    title: { contains: "AWS" },
    priority: { eq: "HIGH" }
  })
  // Returns object containing:
  // expression: "contains(#title, :title_contains) AND #priority = :priority_eq"
  ```
