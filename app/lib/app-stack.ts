import * as cdk from '@aws-cdk/core';
import * as appsync from '@aws-cdk/aws-appsync';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as lambda from '@aws-cdk/aws-lambda';
import { Duration } from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { MappingTemplate } from '@aws-cdk/aws-appsync';

export class AppStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new appsync.GraphqlApi(this, 'Api', {
      name: `testfromcdk`,
      schema: appsync.Schema.fromAsset(`${__dirname}/schema.graphql`),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.IAM,
        },
      },
      xrayEnabled: true,
    });

    const noneDataSource = api.addNoneDataSource(`testfromcdk`);
    noneDataSource.createResolver({
      fieldName: 'publish',
      typeName: 'Mutation',
      requestMappingTemplate: MappingTemplate.fromFile(
        `${__dirname}/request_mapping_template.json`
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        `${__dirname}/response_mapping_template.json`
      ),
    });

    const graphqllambda = new NodejsFunction(this, 'graphqllambda', {
      entry: `${__dirname}/../lambda_function/index.ts`,
      environment: {
        GRAPHQL_API_URL: `${api.graphqlUrl}`,
      },
      functionName: `graphqllambda`,
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 256,
      timeout: Duration.seconds(10),
      bundling: {
        minify: true,
      },
    });

    graphqllambda.addToRolePolicy(
      new iam.PolicyStatement({
        resources: [api.arn, `${api.arn}/*`],
        actions: ['appsync:GraphQL'],
      })
    );
  }
}
