# pulumi-streamlit-ecs-inf

[app]: https://github.com/djsd123/vid-to-mp3
[ECR]: https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html
[ECS]: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html
[node]: https://nodejs.org/en/download/package-manager/
[pulumi]: https://www.pulumi.com/docs/get-started/install/
[Streamlit]: https://docs.streamlit.io/


AWS [ECS] infrastructure I'm using for [Streamlit] deployments from [ECR]

The [ECS] infrastructure deployed in this repo depends on an image repository already existing in [ECR]. This is because
it makes a call to [ECR] in [ecr.ts](ecr.ts) based on the `appName` parameter (See below). If you 
don't have anything already pushed to [ECR].  Then feel free to use one of my [app]s.
Once you have finished deploying the [app] to AWS.  Return to this repo and follow the usage instructions below.

## Requirements

| Name     | Version             |
|----------|---------------------|
| [Pulumi] | > = 3.55.0, < 4.0.0 |
| [node]   | > = 18.13.x, < 19.x |


## Providers

| Name   | Version            |
|--------|--------------------|
| aws    | > = 5.0.0, < 6.0.0 |
| awsx   | > = 1.0.2, < 2.0.0 |
| pulumi | > = 3.0.0, < 4.0.0 |





## Usage

__Deploy to AWS__

Set required environment variables

```shell
export AWS_REGION=<AWS_REGION>
export PULUMI_BACKEND_URL=s3://<YOUR-BUCKET>
export PULUMI_PREFER_YARN=true  // Optional
```


Create Stack

```shell
pulumi stack init
```

See\Copy [Pulumi.pulumi-streamlit-ecs-inf.yaml](Pulumi.pulumi-streamlit-ecs-inf.yaml) for required config parameters


Set your appName

```shell
pulumi config set appName <YOUR APP NAME>
```

Set your previously created domain

```shell
pulumi config set domainName <YOUR DOMAIN NAME>
```

Plan/Preview

```shell
pulumi preview
```

Deploy

```shell
pulumi up
```

Cleanup

```shell
pulumi destroy -y
```


## Outputs

| Name   | Description                                                      |
|--------|------------------------------------------------------------------|
| appUrl | The URL to browse to once your [Streamlit] app has been deployed |

