import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as path from 'path';

export class AppSyncTodoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table with GSIs for efficient querying
    const todosTable = new dynamodb.Table(this, 'TodosTable', {
      tableName: 'Todos',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
    });

    // GSI for querying by status (efficient for millions of items)
    todosTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING
      }
    });

    // GSI for querying by priority (efficient for millions of items)
    todosTable.addGlobalSecondaryIndex({
      indexName: 'PriorityIndex',
      partitionKey: {
        name: 'priority',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING
      }
    });

    todosTable.addGlobalSecondaryIndex({
      indexName: 'CategoryIndex',
      partitionKey: {
        name: 'category',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING
      }
    });

    todosTable.addGlobalSecondaryIndex({
      indexName: 'DueDateIndex',
      partitionKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'dueDate',
        type: dynamodb.AttributeType.STRING
      }
    });

    todosTable.addGlobalSecondaryIndex({
      indexName: 'OrderIndex',
      partitionKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'orderIndex',
        type: dynamodb.AttributeType.NUMBER
      }
    });

    // AppSync GraphQL API
    const api = new appsync.GraphqlApi(this, 'TodoApi', {
      name: 'todo-api',
      definition: appsync.Definition.fromFile(
        path.join(__dirname, 'appsync/schema.graphql')
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365))
          }
        }
      },
      xrayEnabled: true,
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
        excludeVerboseContent: false
      }
    });

    // DynamoDB Data Source
    const todosDataSource = api.addDynamoDbDataSource(
      'TodosDataSource',
      todosTable
    );

    // Query Resolvers
    todosDataSource.createResolver('GetTodoResolver', {
      typeName: 'Query',
      fieldName: 'getTodo',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        path.join(__dirname, 'appsync/resolvers/Query.getTodo.js')
      )
    });

    todosDataSource.createResolver('ListTodosResolver', {
      typeName: 'Query',
      fieldName: 'listTodos',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        path.join(__dirname, 'appsync/resolvers/Query.listTodos.js')
      )
    });

    todosDataSource.createResolver('SearchTodosResolver', {
      typeName: 'Query',
      fieldName: 'searchTodos',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        path.join(__dirname, 'appsync/resolvers/Query.searchTodos.js')
      )
    });

    // Mutation Resolvers
    todosDataSource.createResolver('CreateTodoResolver', {
      typeName: 'Mutation',
      fieldName: 'createTodo',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        path.join(__dirname, 'appsync/resolvers/Mutation.createTodo.js')
      )
    });

    todosDataSource.createResolver('UpdateTodoResolver', {
      typeName: 'Mutation',
      fieldName: 'updateTodo',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        path.join(__dirname, 'appsync/resolvers/Mutation.updateTodo.js')
      )
    });

    todosDataSource.createResolver('DeleteTodoResolver', {
      typeName: 'Mutation',
      fieldName: 'deleteTodo',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        path.join(__dirname, 'appsync/resolvers/Mutation.deleteTodo.js')
      )
    });

    todosDataSource.createResolver('DeleteTodosResolver', {
      typeName: 'Mutation',
      fieldName: 'deleteTodos',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        path.join(__dirname, 'appsync/resolvers/Mutation.deleteTodos.js')
      )
    });

    todosDataSource.createResolver('UpdateTodoOrderResolver', {
      typeName: 'Mutation',
      fieldName: 'updateTodoOrder',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        path.join(__dirname, 'appsync/resolvers/Mutation.updateTodoOrder.js')
      )
    });

    todosDataSource.createResolver('ReorderTodosResolver', {
      typeName: 'Mutation',
      fieldName: 'reorderTodos',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        path.join(__dirname, 'appsync/resolvers/Mutation.reorderTodos.js')
      )
    });

    // Outputs
    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: api.graphqlUrl,
      description: 'GraphQL API URL',
      exportName: 'GraphQLAPIURL'
    });

    new cdk.CfnOutput(this, 'GraphQLAPIKey', {
      value: api.apiKey || '',
      description: 'GraphQL API Key',
      exportName: 'GraphQLAPIKey'
    });

    new cdk.CfnOutput(this, 'GraphQLAPIId', {
      value: api.apiId,
      description: 'GraphQL API ID',
      exportName: 'GraphQLAPIId'
    });

    new cdk.CfnOutput(this, 'TodosTableName', {
      value: todosTable.tableName,
      description: 'DynamoDB Table Name',
      exportName: 'TodosTableName'
    });
  }
}
