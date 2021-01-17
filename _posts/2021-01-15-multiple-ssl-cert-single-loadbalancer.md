---
layout: post
title:  Associate multiple SSL certificates with a single load balancer within a CloudFormation template
date:   2021-01-15 22:00:00 +0000
image:  "https://user-images.githubusercontent.com/1830246/104829709-31cb8380-586e-11eb-80c3-8863aeeaadc3.jpg"
tags:   Tech Troubleshoot IaC AWS SSL
category: Technical
author: paragnair
featured: true
hidden: true
---

Did you know AWS supports associating multiple SSL certificates to a Single Load balancer listener? Here is how you can do that in a [CloudFormation template](https://aws.amazon.com/cloudformation/).

Lets say you have 2 APIs `api.hotel-booking.com` and `api.car-booking.com`. You can have a single Application Load Balancer which can serve both these services. You do that with a [Load Balancer Listener](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-listeners.html). I will add a post later to explain how you can do that but for now lets concentrate on the task at hand, viz., associating multiple SSL certificates to a single Listener using a CloudFormation Template. The following diagram shows the rough architecture where you have a Load Balancer with a Listener which has 2 Rules each resolving to a target group.

![Muliple Domains](https://user-images.githubusercontent.com/1830246/104829719-532c6f80-586e-11eb-83ad-368532734a0a.jpeg)

Now lets secure these services by adding SSL certificates for both the domains. Once you import the SSL certificates for `api.hotel-booking.com` and `api.car-booking.com` into [AWS Certificate Manager](https://aws.amazon.com/certificate-manager/), you can get the certificate ARN from the Certificate Manager console. You can then use the following CloudFormation template as a guide

## CloudFormation Template
```yaml
AWSTemplateFormatVersion: 2010-09-09
Parameters:
  ExistingVPC:
    Type: String
    Description: 'Existing VPC ID. REQUIRED'
  ExistingSubnets:
    Type: CommaDelimitedList
    Description: 'Existing subnets within the Existing VPC. REQUIRED'
  CertificateARN1:
    Type: String
    Description: 'SSL certificate ARN for api.hotel-booking-com'
  CertificateARN2:
    Type: String
    Description: 'SSL certificate ARN for api.car-booking.com'
Resources:
  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Scheme: internet-facing
      SecurityGroups:
        - !GetAtt LoadBalancerSecurityGroup.GroupId
      Subnets: !Ref ExistingSubnets
  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Enable access to load balancer'
      VpcId: !Ref ExistingVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
  LoadBalancerListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - TargetGroupArn: !Ref LoadBalancerListenerDefaultGroup
          Type: forward
      LoadBalancerArn: !Ref LoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref CertificateARN1
  LoadBalancerAdditionalCertificates:
    Type: AWS::ElasticLoadBalancingV2::ListenerCertificate
    Properties:
      Certificates:
        - CertificateArn: !Ref CertificateARN1
      ListenerArn: !Ref LoadBalancerListener
  LoadBalancerListenerDefaultGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Port: 80
      Protocol: HTTP
      VpcId: !Ref ExistingVPC

````

Take a note of the resource `AWS::ElasticLoadBalancingV2::Listener`, line 33. Though we are assoicating multiple SSL certificates with the listener, we are passing only One certificate ARN under `Certificates`, line 43. The key `Certificates` looks like a list and yes it is a list, which can be really misleading and as a newbie you might pass multiple ARNs to it, and get an error when executed

![Up to '1' certificate ARNs can be specified](https://user-images.githubusercontent.com/1830246/104829739-7b1bd300-586e-11eb-91bd-6b0616090d2d.png)

If you read the documentation for [AWS::ElasticLoadBalancingV2::Listener](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-elasticloadbalancingv2-listener.html#cfn-elasticloadbalancingv2-listener-certificates) carefully, it reads

> The default SSL server certificate for a secure listener. You must provide exactly one certificate if the listener protocol is HTTPS or TLS.

The correct way to go about is to add another resource of type `AWS::ElasticLoadBalancingV2::ListenerCertificate` where you can pass multiple certificate ARNs and then associate the resource with the listener. If you check the Listener on AWS console, you will see both the certificates are now associated with it. Now you can add target groups to this listener where you can specify rules based on the host header. As mentioned earlier, I will elaborate in another post how to add target groups to achieve this, but for now assuming that part is already done, when users reach the load balancer with either `api.hotel-booking.com` or `api.car-booking.com` the correct SSL certificate will be picked up.

> It is what we know already that often prevents us from learning.<cite>- Claude Bernard</cite>