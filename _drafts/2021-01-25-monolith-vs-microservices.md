---
layout: post
title:  Explode your Monolith and open your eyes to Microservices
date:   2021-01-25 20:00:00 +0000
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

## Traditional approach
Before Microservices, you would be hosting all this under a single application which has this one Visual Studio soliution file with multiple projects within, each concentrating on a Bounded Context

* `MyDomain.Service.Users` -  Everything related to User domain
* `MyDomain.Service.Concerts` - Everything related to Concert domain
* `MyDomain.Service.Accommodation` - Everything related to Accommodation domain 
* `MyDomain.API` - MVC application with Controllers for Users, Concerts & Accommodation which has reference to the services above.

This works great and still very much workable in the modern world, while it has its benefits, it does have a few drawbacks as well. Lets look at the benefits:
* Everything is in a single solution, so much easier to replicate and debug and you get the whole picture
