---
layout: post
title:  "Docker: failed to export image"
date:   2021-01-06 20:00:00 +0000
image:  docker-unsplash.jpg
tags:   Tech Docker Troubleshoot AWS
---

Docker says `failed to export image: failed to create image: failed to get layer`

Docker, you are amazing.. but what do you mean by this really confusing message?

```
failed to export image: failed to create image: failed to get layer
```

So it all started with [DockerHub](https://hub.docker.com) introducing a [Download rate limit](https://docs.docker.com/docker-hub/download-rate-limit/) on anonymous pulls which was like 100 pulls in 6hrs (at the time of this writing). So it was my team's task to update all our builds to start using authenticated pulls. The changes were pretty easy to incorporate so we split the work among the team so one person does not end up making the monotonous change across the board.

We use [AWS](https://aws.amazon.com/) as our cloud provider so it just makes sense to use CodeBuild to build our code. All was running fine until we started updating to authenticated pulls (you will see eventually that was not the culprit). One of my team members reported, they were getting that error `failed to export image: failed to create...` on one of the repositories. It was a little confusing because the project we were updating had 3 builds and only one of it failed. I know for the fact that all the builds use the exact same buildspec file, so it could not be the instructions in that file. Next on the checklist, permissions, which were the same for all the builds. The surprising part was, that we did not touch the dockerfile.

Here is how our dockerfile looked

{% highlight yaml %}
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
{% endhighlight %}

Like a religious developer you have to ask the Expert.. namely Google which will then direct you to the Real Expert.. namely [StackOverflow](https://stackoverflow.com/). When you search for that error message you will most likely come across [this post](https://stackoverflow.com/questions/51115856/docker-failed-to-export-image-failed-to-create-image-failed-to-get-layer) where some suggested fix is to write a `Run true` instruction before each `Copy` line in your dockerfile. So we tried that and still not success. 

After crawling through numerous forums I said to myself "Am I looking at the wrong place?" Lets see the commit history on that repository and see what changes were made. I noticed, we had changed the docker build instance from `aws/codebuild/docker:1.12.1` to `aws/codebuild/docker:17.09.0` which gave an indication that something in our dockerfile was OK in `1.12.1` but `17.09.0` does not like it anymore. If you take a closer look at our dockerfile, you will notice though it is not [multi-stage build](https://docs.docker.com/develop/develop-images/multistage-build/), we are still running tests first and then creating a release in the SAME CONTAINER. Let me walk you through the file

* First we copy all the assets to the `app` folder and run tests
{% highlight yaml %}
FROM mcr.microsoft.com/dotnet/core/sdk:2.1

WORKDIR /app
COPY NuGet.config Foo.Common/. Foo.Common/
...

RUN dotnet restore Foo.Common.Tests && dotnet test && dotnet restore Foo.Client.Tests && dotnet test Foo.Client.Tests/Foo.Client.Tests.csproj

...
{% endhighlight %}

* Then we copy the assets excluding tests to the same folder
{% highlight yaml %}
...

WORKDIR /app
COPY NuGet.config Foo.Common/. Foo.Common/
COPY NuGet.config Foo.Client/. current/

WORKDIR current
RUN dotnet restore && dotnet publish -c Release -o out
{% endhighlight %}

In theory, what has happened is the same files have been copied over again and this I assume is causing that error. In our case the fix was just to make sure the assets were copied to a different folder for tests and different folder for the release build. Here is the fixed dockerfile

{% highlight yaml %}
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
{% endhighlight %}

The above solution worked for us but in your case that error could have been a result of something else in your dockerfile. As you can see, that error is so general that its quite difficult to figure out the right reason.

Finally, my reccomendation would be to move to [multi-stage builds](https://docs.docker.com/develop/develop-images/multistage-build/) where the tests and release builds would happen on a separate container. Hope this post has helped someone who encountered this error and the top-listed solutions on Google did not work for them. 

You go through tireless hours of debugging something but once you have found a solution, its hours well invested, you have learned something new.

> Live as if you were to die tomorrow. Learn as if you were to live forever. - Mahatma Gandhi