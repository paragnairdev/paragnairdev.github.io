---
layout: post
title:  Associate multiple SSL certificates with a single load balancer within a CloudFormation template
date:   2021-01-11 11:00:00 +0000
image:  assets/images/single-elb-multiple-domains.jpeg
tags:   Tech Troubleshoot IaC AWS
category: Technical
author: paragnair
---

Here is how you can associate multiple SSL certificates to a Load balancer listener on AWS.

Lets say you have 2 APIs `api.hotel-booking.com` and `api.car-booking.com`. You can have a single Application Load Balancer with multiple SSL certificates associated with them and then have 2 target groups each serving a different application/service.

![Muliple Domains](/assets/images/single-elb-multiple-domains.jpeg)