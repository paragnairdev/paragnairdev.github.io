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

Lets assume you have a ticket booking platform
