#!/bin/bash
# DynamoDB Seed Script for Floki

echo "Seeding DynamoDB tables with test data..."

# Add a few test todos to the DynamoDB table
for i in {1..10}; do
  title="Todo Item $i"
  subtitle="Subtitle for item $i"
  description="Description for todo item $i"
  
  # Random status
  statuses=("PENDING" "IN_PROGRESS" "COMPLETED" "ARCHIVED" "CANCELLED")
  status=${statuses[$RANDOM % ${#statuses[@]}]}
  
  # Random priority
  priorities=("LOW" "MEDIUM" "HIGH" "URGENT")
  priority=${priorities[$RANDOM % ${#priorities[@]}]}
  
  # Random category
  categories=("WORK" "PERSONAL" "SHOPPING" "HEALTH" "FINANCE" "EDUCATION" "TRAVEL" "OTHER")
  category=${categories[$RANDOM % ${#categories[@]}]}
  
  # Future date
  future_date=$(date -v+$(($RANDOM % 30))d +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -d "+$(($RANDOM % 30)) days" +"%Y-%m-%dT%H:%M:%SZ")
  
  echo "Adding todo $i: $title ($status/$priority)"
  
  AWS_ENDPOINT_URL=http://localhost:4566 AWS_DEFAULT_REGION=us-east-1 AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws dynamodb put-item --table-name Todos --item "{
    \"id\": {\"S\": \"todo-$i\"},
    \"title\": {\"S\": \"$title\"},
    \"subtitle\": {\"S\": \"$subtitle\"},
    \"description\": {\"S\": \"$description\"},
    \"priority\": {\"S\": \"$priority\"},
    \"status\": {\"S\": \"$status\"},
    \"category\": {\"S\": \"$category\"},
    \"completed\": {\"BOOL\": false},
    \"owner\": {\"S\": \"user-$i\"},
    \"createdAt\": {\"S\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"},
    \"updatedAt\": {\"S\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"},
    \"orderIndex\": {\"N\": \"$(($i * 10))\"},
    \"activePartition\": {\"S\": \"ALL_ACTIVE\"},
    \"dueDate\": {\"S\": \"$future_date\"},
    \"tags\": {\"L\": [{\"S\": \"tag$i\"}]}
  }" --endpoint-url http://localhost:4566 > /dev/null 2>&1
  
  if [ $? -ne 0 ]; then
    echo "Failed to add todo $i"
  fi
done

echo "Seed completed. Added 10 sample todo items to DynamoDB."
echo ""
echo "You can verify with:"
echo "AWS_ENDPOINT_URL=http://localhost:4566 AWS_DEFAULT_REGION=us-east-1 AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws dynamodb scan --table-name Todos"