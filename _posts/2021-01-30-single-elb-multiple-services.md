---
layout: post
title:  Serve multiple services with single load balancer on AWS
date:   2021-01-30 15:00:00 +0000
image:  "https://user-images.githubusercontent.com/1830246/104829719-532c6f80-586e-11eb-83ad-368532734a0a.jpeg"
tags:   Tech InfrastructureAsCode AWS Microservices
category: Technical
toc: true
author: paragnair
---

Using a microservices architecture, serve multiple services from a single Elastic Load balancer On AWS. Here is how you can have a single domain serve multiple services where each service is hosted as a separate instace of either containers, EC2 instances or AWS Lambda.

## The scenario
Lets assume you have a booking platform and you have divided your service into multiple [Bounded Contexts](https://martinfowler.com/bliki/BoundedContext.html). Assuming your domain is `https://api.my-domain.com`, following are your resources under the same:
* Accomodation - `https://api.my-domain.com/accommodation/`
* User - `https://api.my-domain.com/users/`
* Concert - `https://api.my-domain.com/concerts/`


A traditional approach would be hosting all this under a single application which has this one Visual Studio solution with multiple projects within, each concentrating on a Bounded Context

* `MyDomain.Service.Accommodation` - Everything related to Accommodation domain 
* `MyDomain.Service.Users` -  Everything related to User domain
* `MyDomain.Service.Concerts` - Everything related to Concert domain
* `MyDomain.API` - MVC application with Controllers for Users, Concerts & Accommodation which has reference to the services above.

You would deploy this single MVC application with some autoscaling rules. This is great, but imagine you have separate teams, each working on one of the Bounded Contexts. Then you are left with multiple teams trying to work on the same source and a change to one Bounded Context means you have to re-deploy the whole thing. Life as a Developer/DevOps does not need to be this complex.

## The alternative
On AWS, you could have a single Load Balancer which can then redirect requests to different services based on the the path of the request. The following illustration shows how to achieve this:

![Figure 1](https://user-images.githubusercontent.com/1830246/106366031-29c11880-6331-11eb-9b00-6f8b3bcda3b4.png)

Let me walk you through what it does:
* A request comes to the loadbalancer `https://api.my-domain.com/accommodation/`.
* The loadbalancer has a HTTPS Listener Rule which says if the host header is `api.my-domain.com` and the path matches the pattern `/accommodation/*`, the request should be forwarded to a target group which has a bunch of [EC2](https://aws.amazon.com/ec2/?ec2-whats-new.sort-by=item.additionalFields.postDateTime&ec2-whats-new.sort-order=desc) instances which serve data related to Accommodation booking.
* Likewise, a request `https://api.my-domain.com/users/` resolves to the rule which has host header `api.my-domain.com` and the path matching the pattern `/users/*`, which then gets forwarded to an [Elastic Container Service](https://aws.amazon.com/ecs/?whats-new-cards.sort-by=item.additionalFields.postDateTime&whats-new-cards.sort-order=desc&ecs-blogs.sort-by=item.additionalFields.createdDate&ecs-blogs.sort-order=desc) target group, having multiple docker containers dealing with data related to Users.
* And finally the last rule says if the path matches the pattern `/concerts/*` the request gets forwarded to a target group which points to a [AWS Lambda](https://aws.amazon.com/lambda/).

Other than balancing your traffic, there are further benefits to this kind of approach:
* You are not restricted to using a single technology for all your services. You can have the Users service built in [.Net](https://dotnet.microsoft.com/) while Concerts service built using [Node](https://nodejs.org/en/). In the above illustration, the docker containers might be running a ASP.Net Web API while the Lambda, serving Concerts, is a Node lambda.
* Even if splitting your monolith into microservices seems like a massive task, you can still use this architecture where you deploy the monolith to multiple target groups each serving one Bounded Context. Though each instance will be running the whole monolith, requests coming to it will be dealing with a single Bounded Context. In fact, this is one of the mechanisms I used recently to troubleshoot a degrading Service which eventually was down to one endpoint which had non-performant code.

> Creativity involves breaking out of established patterns in order to look at things in a different way. <cite>- Edward de Bono</cite>

Finally, If you know me well, you know I love Infrastructure As Code, so here is a sample Cloudformation template which demonstrates the illustration earlier:

## Sample cloudformation template

```yaml
AWSTemplateFormatVersion: 2010-09-09
Description: Template to serve different endpoints of a domain with different physical services

Parameters:
  ExistingVPC:
    Type: String
    Description: 'Existing VPC Id. REQUIRED'
  LoadBalancerListenerARN:
    Type: String
    Description: 'ARN for the Load balancer'
  AccommodationAMIId:
    Type: String
    Description: 'AMI Id of the image which has Accommodation service'
  UsersAPIImagePath:
    Type: String
    Description: 'Docker Image path for Users Service'
  ECSClusterARN:
    Type: String
    Description: 'ARN of ECS Cluster'
  ArtifactsBucket:
    Type: String
    Description: 'The name of the bucket where the lambda build artifacts exist'
  LambdaCodePackageObjectKey:
    Type: String
    Description: 'The s3 object key of the Concerts Lambda artifacts.'

Resources:
  # Resources related to the Accommodation service
  AccommodationLaunchConfiguration:
    Type: AWS::AutoScaling::LaunchConfiguration
    Properties:
      ImageId: !Ref AccommodationAMIId
      # Configuration ommitted for brevity
      ...
  AccommodationScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      LaunchConfigurationName: !Ref AccommodationLaunchConfiguration
      TargetGroupARNs:
        - !Ref AccommodationEC2TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 60
  AccommodationListenerRule:
    Type: AWS::ElasticLoadBalancingV2::ListenerRule
    Properties:
      Actions:
        - TargetGroupArn: !Ref AccommodationEC2TargetGroup
          Type: 'forward'
      Conditions:
        - Field: 'host-header'
          Values:
            - 'api.my-domain.com'
        - Field: 'path-pattern'
          Values: ['/accommodation/*']
      ListenerArn: !Ref LoadBalancerListenerARN
      Priority: 1
  AccommodationEC2TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      HealthCheckIntervalSeconds: 60
      HealthCheckPath: '/accommodation/healthcheck'
      Port: 80
      Protocol: 'HTTP'
      VpcId: !Ref ExistingVPC

  # Resources related to the Users service
  UsersAPIECSTask:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub ${AWS::StackName}-api
      ContainerDefinitions:
        - Name: 'UsersAPI'
          Image: !Ref UsersAPIImagePath
          MemoryReservation: 128
          Memory: 256
          LogConfiguration:
            LogDriver: "awslogs"
            Options:
              awslogs-group: !Ref APILogGroup
              awslogs-region: !Ref "AWS::Region"
          PortMappings:
            - ContainerPort: 80
              HostPort: 0
  UsersAPIECSService:
    Type: AWS::ECS::Service
    Properties:
      Cluster: !Ref ECSClusterARN
      DesiredCount: 1
      TaskDefinition: !Ref UsersAPIECSTask
      LoadBalancers:
        - ContainerName: "UsersAPI"
          ContainerPort: 80
          TargetGroupArn: !Ref UsersECSTargetGroup
  UsersListenerRule:
    Type: AWS::ElasticLoadBalancingV2::ListenerRule
    Properties:
      Actions:
        - TargetGroupArn: !Ref UsersECSTargetGroup
          Type: 'forward'
      Conditions:
        - Field: 'host-header'
          Values:
            - 'api.my-domain.com'
        - Field: 'path-pattern'
          Values: ['/users/*']
      ListenerArn: !Ref LoadBalancerListenerARN
      Priority: 2
  UsersECSTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      HealthCheckIntervalSeconds: 60
      HealthCheckPath: '/users/healthcheck'
      Port: 80
      Protocol: "HTTP"
      VpcId: !Ref ExistingVPC

  # Resources related to the Concerts service
  ConcertsLambda:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Code:
        S3Bucket: !Ref ArtifactsBucket
        S3Key: !Ref LambdaCodePackageObjectKey
      Runtime: nodejs12.x
      Timeout: 30
      MemorySize: 128
  ConcertsListenerRule:
    Type: AWS::ElasticLoadBalancingV2::ListenerRule
    Properties:
      Actions:
        - TargetGroupArn: !Ref ConcertsLambdaTargetGroup
          Type: 'forward'
      Conditions:
        - Field: 'host-header'
          Values:
            - 'api.my-domain.com'
        - Field: 'path-pattern'
          Values: ['/concerts/*']
      ListenerArn: !Ref LoadBalancerListenerARN
      Priority: 3
  ConcertsLambdaTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      HealthCheckEnabled: false
      Name: ConcertsLambdaTarget
      TargetType: lambda
      Targets:
      - Id: !GetAtt [ ConcertsLambda, Arn ]
```

## Next steps
So you ask what next? 

Well, I would suggest embracing modern trends and move on to Exploding your Monolith to Microservices. I will write up a post soon on this, until then Happy Coding!