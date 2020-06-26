const cdk = require('@aws-cdk/core');
const iam = require('@aws-cdk/aws-iam');
const dynamodb = require('@aws-cdk/aws-dynamodb');
const s3 = require('@aws-cdk/aws-s3');
const s3Deployment = require('@aws-cdk/aws-s3-deployment');
const lambda = require('@aws-cdk/aws-lambda');
const cloudfront = require('@aws-cdk/aws-cloudfront');

const { bucketName } = process.env;
const tableName = 'exampleSessionTable';
const roleArn = process.env.arnRole;

class KeycloakCloudFrontExampleStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    const role = iam.Role.fromRoleArn(this, `Role ${bucketName}`, roleArn, { mutable: false });
    const bucket = new s3.Bucket(this, 'lambda-edge-bucket', {
      accessControl: s3.BucketAccessControl.AUTHENTICATED_READ,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketName,
    });

    const lambdaEdge = new lambda.Function(this, 'lambda-edge-example', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.lambda',
      code: lambda.Code.fromAsset('../lambda-edge-example/dist'),
      functionName: `function_${bucketName}`,
      role,
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
    });
    const VersionLambdaEdge = new lambda.Version(this, 'lambda-edge-example Version', {
      lambda: lambdaEdge,
      description: `lambda-edge-example Version ${Math.random() * (99999 - 1) + 1}`,
    });

    const accessIdentityId = `access-identity-${bucketName}`;

    const comment = `OriginAccessIdentity-${bucketName}`;
    const oai = new cloudfront.OriginAccessIdentity(this, accessIdentityId, {
      comment,
    });

    bucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [oai.grantPrincipal],
      actions: ['s3:GetObject'],
      resources: [`arn:aws:s3:::${bucketName}/*`],
    }));
    const sessionTable = new dynamodb.Table(this, `Session ${bucketName}`, {
      tableName,
      partitionKey: { name: 'session', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'exp',
    });
    sessionTable.grantFullAccess(role);
    const frontWebDistribution = new cloudfront.CloudFrontWebDistribution(this, `cloudfront-${bucketName}`, {
      originConfigs: [{
        s3OriginSource: {
          s3BucketSource: bucket,
          originAccessIdentity: oai,
        },
        behaviors: [
          {
            isDefaultBehavior: true,
            allowedMethods: cloudfront.CloudFrontAllowedMethods.ALL,
            forwardedValues: {
              cookies: { forward: 'all' },
              headers: [
                'Authorization',
                'Referer',
                'Origin',
              ],
              queryString: true,
            },
            lambdaFunctionAssociations: [{
              lambdaFunction: VersionLambdaEdge,
              eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
            }],
          },
        ],
      }],
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      defaultRootObject: 'index.html',
    });
    // eslint-disable-next-line no-new
    new s3Deployment.BucketDeployment(this, `BucketDeployment ${bucket}`, {
      destinationBucket: bucket,
      role,
      distribution: frontWebDistribution,
      sources: [
        s3Deployment.Source.asset('../public'),
      ],
    });
  }
}
const app = new cdk.App();
// eslint-disable-next-line no-new
new KeycloakCloudFrontExampleStack(app, `example-${bucketName}`);
app.synth();
