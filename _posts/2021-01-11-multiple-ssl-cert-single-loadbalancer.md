---
layout: post
title:  Associate multiple SSL certificates with a single load balancer within a CloudFormation template
date:   2021-01-11 11:00:00 +0000
image:  assets/images/multiple-ssl-single-elb.jpg
tags:   Tech Troubleshoot IaC AWS
category: Technical
author: paragnair
---

Did you know AWS supports associating multiple SSL certificates to a Single Load balancer listener? Here is how you can do that in a [CloudFormation template](https://aws.amazon.com/cloudformation/).

Lets say you have 2 APIs `api.hotel-booking.com` and `api.car-booking.com`. You can have a single Application Load Balancer which can serve both these service. You do that with a [Load Balancer Listener](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-listeners.html). I will add a post later to explain how you can do that but for now lets concentrate on the task at hand, viz., associating multiple SSL certificates to a single Listener using a CloudFormation Template. The following diagram shows the rough architecture where you have a Load Balancer with a Listener which has 2 Rules each resolving to a target group.

![Muliple Domains](/assets/images/single-elb-multiple-domains.jpeg)

Now lets secure these services by adding SSL certificates for both the domains.