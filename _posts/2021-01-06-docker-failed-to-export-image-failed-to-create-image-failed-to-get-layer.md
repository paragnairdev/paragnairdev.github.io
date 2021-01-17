---
layout: post
title:  "Docker: failed to export/create/get image"
date:   2021-01-06 20:00:00 +0000
image:  assets/images/docker-unsplash.jpg
tags:   Tech Docker Troubleshoot AWS
category: Technical
author: paragnair
---

Docker build failed with error `failed to export image: failed to create image: failed to get layer`. Here is how I solved it.

Docker, you are amazing. I just Love how Docker has changed the way I have looked at building microservices but there are times when it tells me there is a problem, with a description that can mean anything. Hey Docker, what do you mean by this really confusing message? 

```
failed to export image: failed to create image: failed to get layer
```

Seems like it is telling me 3 different things here?
1. failed to export image
2. failed to create image
3. failed to get layer

## Some background

It all started with [Docker Hub](https://hub.docker.com) introducing a [Download rate limit](https://docs.docker.com/docker-hub/download-rate-limit/) on anonymous pulls which was like 100 pulls in 6hrs (at the time of this writing). So it was my team's task to update all our builds to start using authenticated pulls. The changes were pretty easy to incorporate, and we split the work among the team members, so one person does not end up making the monotonous change across the board.

We use [AWS](https://aws.amazon.com/) as our cloud provider, hence it makes good sense to use [CodeBuild](https://aws.amazon.com/codebuild/) to build our code. All was running fine until we started updating to authenticated pulls (you will see eventually that was not the culprit). One of my team members reported, on one of the repositories, they were getting that error mentioned earlier `failed to export image: failed to create...`. It was a little confusing because the project we were updating had 3 builds and only one of it failed. I know for the fact that all the builds within that repository use the exact same buildspec file, so it could not be the instructions in that file which were problematic. Next on the checklist, permissions, which were the same for all the builds. The surprising part was, we did not touch the dockerfile at all.

Here is how our dockerfile looked

## Dockerfile
```yaml
FROM mcr.microsoft.com/dotnet/core/sdk:2.1

WORKDIR /app
COPY NuGet.config Foo.Common/. Foo.Common/
COPY NuGet.config Foo.Common.Tests/. Foo.Common.Tests/
COPY NuGet.config Foo.Client/. Foo.Client/
COPY NuGet.config Foo.Client.Tests/. Foo.Client.Tests/

RUN dotnet restore Foo.Common.Tests && dotnet test && dotnet restore Foo.Client.Tests && dotnet test Foo.Client.Tests/Foo.Client.Tests.csproj

WORKDIR /app
COPY NuGet.config Foo.Common/. Foo.Common/
COPY NuGet.config Foo.Client/. current/

WORKDIR current
RUN dotnet restore && dotnet publish -c Release -o out
```

Like a religious developer you have to ask the Expert.. namely Google which will then direct you to the Real Expert.. namely [StackOverflow](https://stackoverflow.com/). When you search for that error message you will most likely come across [this post](https://stackoverflow.com/questions/51115856/docker-failed-to-export-image-failed-to-create-image-failed-to-get-layer) where some suggested fix is to write a `Run true` statement before each `Copy` statement in your dockerfile. So we tried that and still no success. 

After crawling through numerous forums I said to myself "Am I looking at the wrong place?" Lets see the commit history on that repository and see what changes were made. I noticed, we had changed the docker build instance from `aws/codebuild/docker:1.12.1` to `aws/codebuild/docker:17.09.0` which gave an indication that something in our dockerfile was OK in `1.12.1` but `17.09.0` did not like it anymore. If you take a closer look at our [Dockerfile](#dockerfile), you will notice though it is not [multi-stage build](https://docs.docker.com/develop/develop-images/multistage-build/), we are still running tests first and then creating a release in the SAME CONTAINER. Let me walk you through the file

First we copy all the assets to the `app` folder and run tests
```yaml
FROM mcr.microsoft.com/dotnet/core/sdk:2.1

WORKDIR /app
COPY NuGet.config Foo.Common/. Foo.Common/
...

RUN dotnet restore Foo.Common.Tests && dotnet test && dotnet restore Foo.Client.Tests && dotnet test Foo.Client.Tests/Foo.Client.Tests.csproj

...
```

Then we copy the assets excluding tests to the same folder
```yaml
...

WORKDIR /app
COPY NuGet.config Foo.Common/. Foo.Common/
COPY NuGet.config Foo.Client/. current/

WORKDIR current
RUN dotnet restore && dotnet publish -c Release -o out
```

In theory, the same files have been copied over again and this I assume is causing that error. In our case the fix was just to make sure the assets were copied to a different folder for tests and different folder for the release build. Here is the fixed dockerfile

## Updated Dockerfile

```yaml
FROM mcr.microsoft.com/dotnet/core/sdk:2.1

WORKDIR /tests
COPY NuGet.config Foo.Common/. Foo.Common/
COPY NuGet.config Foo.Common.Tests/. Foo.Common.Tests/
COPY NuGet.config Foo.Client/. Foo.Client/
COPY NuGet.config Foo.Client.Tests/. Foo.Client.Tests/

RUN dotnet restore Foo.Common.Tests && dotnet test && dotnet restore Foo.Client.Tests && dotnet test Foo.Client.Tests/Foo.Client.Tests.csproj

WORKDIR /app
COPY NuGet.config Foo.Common/. Foo.Common/
COPY NuGet.config Foo.Client/. current/

WORKDIR current
RUN dotnet restore && dotnet publish -c Release -o out
```

The above solution worked for us but in your case that error could have been a result of something else in your dockerfile. As you can see, that error is so general that its quite difficult to figure out the exact reason. Hey Docker, don't worry, no love lost here, still Love You.

Finally, my reccomendation would be to move to [multi-stage builds](https://docs.docker.com/develop/develop-images/multistage-build/) where the tests and release builds would happen on a separate container. Hope this post helps someone who encounters this error and the top-listed solutions on Google/StackOverflow did not work. 

You go through tireless hours of debugging something, but once you have found a solution, its hours well invested, you have learned something new.

> Live as if you were to die tomorrow. Learn as if you were to live forever. <cite>- Mahatma Gandhi</cite>

