#!/bin/bash
# Script to test AppSync API with sample queries

API_URL=$1
API_KEY=$2

if [ -z "$API_URL" ] || [ -z "$API_KEY" ]; then
    echo "Usage: $0 <API_URL> <API_KEY>"
    echo ""
    echo "Example:"
    echo "  $0 https://xxx.appsync-api.us-east-1.amazonaws.com/graphql abc123"
    exit 1
fi

echo "🧪 Testing AppSync API..."
echo ""

# Create a Todo
echo "1️⃣ Creating a Todo..."
CREATE_RESULT=$(curl -s -X POST "$API_URL" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createTodo(input: { title: \"Test Todo\", description: \"Testing AppSync\", completed: false }) { id title description completed owner createdAt updatedAt } }"
  }')

echo "$CREATE_RESULT" | jq .
TODO_ID=$(echo "$CREATE_RESULT" | jq -r '.data.createTodo.id')

if [ -z "$TODO_ID" ] || [ "$TODO_ID" == "null" ]; then
    echo "❌ Failed to create Todo"
    exit 1
fi

echo ""
echo "✅ Created Todo with ID: $TODO_ID"
echo ""

# List Todos
echo "2️⃣ Listing all Todos..."
curl -s -X POST "$API_URL" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { listTodos { items { id title description completed owner createdAt updatedAt } } }"
  }' | jq .

echo ""
echo ""

# Get specific Todo
echo "3️⃣ Getting Todo by ID..."
curl -s -X POST "$API_URL" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"query { getTodo(id: \\\"$TODO_ID\\\") { id title description completed owner createdAt updatedAt } }\"
  }" | jq .

echo ""
echo ""

# Update Todo
echo "4️⃣ Updating Todo..."
curl -s -X POST "$API_URL" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"mutation { updateTodo(input: { id: \\\"$TODO_ID\\\", title: \\\"Updated Todo\\\", completed: true }) { id title description completed updatedAt } }\"
  }" | jq .

echo ""
echo ""

# Delete Todo
echo "5️⃣ Deleting Todo..."
curl -s -X POST "$API_URL" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"mutation { deleteTodo(id: \\\"$TODO_ID\\\") { id title } }\"
  }" | jq .

echo ""
echo "✅ All tests completed!"
