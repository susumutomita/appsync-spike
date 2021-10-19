import gql from 'graphql-tag';
import 'isomorphic-fetch';
const AWSAppSyncClient = require('aws-appsync').default;
const GRAPHQL_API_URL = process.env.GRAPHQL_API_URL || '';
const aws = require('aws-sdk');
const moment = require('moment');
const REGION = 'ap-northeast-1';

export async function handler() {
  const id = '1234';
  const loggedAt = moment().unix();
  const r = await mutate(loggedAt, id);
  console.log(r.data);
}

async function mutate(loggedAt: number, id: string) {
  const query = gql(`mutation publish($input: Input!) {
  publish(input: $input) {
    loggedAt
    id
  }
}`);

  const params = {
    input: {
      loggedAt: loggedAt,
      id: id,
    },
  };

  console.log(JSON.stringify(query));
  const appSyncClient = new AWSAppSyncClient({
    url: GRAPHQL_API_URL,
    region: REGION,
    auth: {
      type: 'AWS_IAM',
      credentials: aws.config.credentials,
    },
    disableOffline: true,
  });

  try {
    const data = await appSyncClient.mutate({
      variables: params,
      mutation: query,
      fetchPolicy: 'no-cache',
    });
    return data;
  } catch (err) {
    console.error(err);
    return 'Error';
  }
}
