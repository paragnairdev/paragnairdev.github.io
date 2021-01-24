---
layout: post
title:  Serve multiple services with single load balancer
date:   2021-01-23 17:00:00 +0000
image:  "https://user-images.githubusercontent.com/1830246/104829719-532c6f80-586e-11eb-83ad-368532734a0a.jpeg"
tags:   Tech IaC AWS Microservices
category: Technical
author: paragnair
---

Using a microservices architecture, serve mupltiple services from a single Elastic Load balancer On AWS. Here is how you can have a single domain serve multiple services where each service is hosted in its own Container.

Lets assume you have a booking platform and you have divided your service into multiple [Bounded Contexts](https://martinfowler.com/bliki/BoundedContext.html). Assuming your domain is `https://api.my-domain.com` and following are your resources under that
* User - `https://api.my-domain.com/users`
* Concert - `https://api.my-domain.com/concerts`
* Accomodation - `https://api.my-domain.com/accommodation`

A traditional approach would be hosting all this under a single application which has this one Visual Studio soliution file with multiple projects within, each concentrating on a Bounded Context

* `MyDomain.Service.Users` -  Everything related to User domain
* `MyDomain.Service.Concerts` - Everything related to Concert domain
* `MyDomain.Service.Accommodation` - Everything related to Accommodation domain 
* `MyDomain.API` - MVC application with Controllers for Users, Concerts & Accommodation which has reference to the services above.

And you would deploy this single MVC application with some autoscaling rules. This is great, but you have separate teams, each working on one of the Bounded Context. Then you are left with multiple teams trying to work on the same source and a change to one Bounded Context means you have to re-deploy the whole thing. Life as a Developer/DevOps does not need to be this complex.

On AWS, you could have a single Load Balancer which can then redirect requests to different services based on the the path of the request. The following illustration shows how to achieve that

Let me walk you through what it does:
* A request comes to the loadbalancer `https://api.my-domain.com/users`.
* The loadbalancer has a HTTPS Listener Rule which says if the host header is `api.my-domain.com` and the path matches the pattern `/users/*`, the request should be forwarded to an ECS container which is running a service which deals with Users.
* Likewise, a request `https://api.my-domain.com/accommodation` resolves to the rule which has host header `api.my-domain.com` and the path matching the pattern `/accommodation/*`.

There are further benefits to this kind of architecture
* You are not restricted to using a single technology for all your services. You can have the Users service built in .Net while Concerts service can be built using Node
* Even if splitting your monolith into microservices is not possible, you can still use this architecture where you can deploy the monolith to multiple target groups each serving one Bounded Context. In fact, this is one of the mechanisms I used to troubleshoot a degrading Service which eventually was down to one endpoint which had non-performant code.