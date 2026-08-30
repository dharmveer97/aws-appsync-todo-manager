import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AppSyncTodoStack } from '../lib/appsync-stack';

test('AppSync API and Resolvers are created', () => {
  const app = new cdk.App();
  const stack = new AppSyncTodoStack(app, 'TestAppSyncStack');
  const template = Template.fromStack(stack);

  // Verify AppSync GraphQL API exists
  template.hasResourceProperties('AWS::AppSync::GraphQLApi', {
    Name: 'todo-api',
    AuthenticationType: 'API_KEY'
  });

  // Verify DynamoDB Tables exist
  template.resourceCountIs('AWS::DynamoDB::Table', 2);

  // Verify Resolvers exist as UNIT resolvers
  template.hasResourceProperties('AWS::AppSync::Resolver', {
    TypeName: 'Query',
    FieldName: 'listTodos',
    Kind: 'UNIT'
  });

  template.hasResourceProperties('AWS::AppSync::Resolver', {
    TypeName: 'Query',
    FieldName: 'searchTodos',
    Kind: 'UNIT'
  });

  template.hasResourceProperties('AWS::AppSync::Resolver', {
    TypeName: 'Mutation',
    FieldName: 'deleteTodos',
    Kind: 'UNIT'
  });
});
