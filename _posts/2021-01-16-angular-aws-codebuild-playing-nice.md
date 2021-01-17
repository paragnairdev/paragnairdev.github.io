---
layout: post
title:  "Angular and AWS CodeBuild not playing nicely? Here is how to make them friends"
date:   2021-01-16 17:00:00 +0000
image:  "https://user-images.githubusercontent.com/1830246/104824876-cffb2180-584d-11eb-9e9d-cbc646c9653d.png"
#featured-image: "https://user-images.githubusercontent.com/1830246/104846264-8e13bf00-58d1-11eb-9553-5b127b6cc0d2.png"
featured-image: "https://user-images.githubusercontent.com/1830246/104846400-40e41d00-58d2-11eb-8c3b-45375dca7ef6.png"
tags:   Tech Development DevOps AWS Codebuild Angular
category: Technical
author: paragnair
featured: true
hidden: true
---

You are using AWS as your cloud platform and you decide to write your Website in Angular, everything works fine on your local machine. Great! Now it's time to integrate it in a CI/CD pipeline with AWS Codebuild to run tests (hope you are taking the TDD approach) and deploy it. Bummer! When you try to run tests on CodeBuild it's not happy :frowning: 

Don't worry, lets make them play nicely together. When I came across this roadblock, I spent hours trying to get to the bottom of this, since the information was not clearly available, I thought I should share this fix with others to save someone going through the pain I went through.

> When life puts rocks in your way, build something nice with them. <cite>- Volksweisheit</cite>

## Background

Like any other enthusiastic developer, as soon as the decision was made to go with building an Angular App, I dived into code and built the initial awesome landing page with some bare minimum components. Of course I chose TDD and was happy with everything. Ran the tests locally and things were awesome. Now was the time to deploy it to the AWS cloud so the product acceptance tests could go ahead. The plan was to run the Angular App in a NGinx container, so the deployment process looks like this:
* Run Tests
* Build staging artifacts
* Deploy to staging ECS Cluster
* Test functionality on staging
* Build production artifacts
* Deploy to production ECS cluster

Simple steps, right? Well that looked simple until I failed at the very first step.. Run Tests. 

If you scaffold a new Angular app with 
```node
ng new my-awesome-app
```
It scaffolds a project with tests which run with Chrome and Karma. They will run fine on your local machine, as you have chrome installed and you will be happy :bowtie: Lets move on, then I created a Dockerfile which would install [Puppeteer](https://developers.google.com/web/tools/puppeteer) which runs a headless browser. This is how my Dockerfile looks:

### Dockerfile
```yaml
FROM node:12.2.0-alpine as build-stage

# Install pupeteer so we can run tests
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN apk add --no-cache chromium && \
        yarn add puppeteer@1.19.0 && \
        addgroup -S pptruser && adduser -S -g pptruser pptruser \
        && mkdir -p /home/pptruser/Downloads /app \
        && chown -R pptruser:pptruser /home/pptruser \
        && chown -R pptruser:pptruser /app

ENV CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_DRIVER=/usr/bin/chromedriver

# Copy the source files
WORKDIR /app
COPY . /app/
RUN npm install && npm rebuild

# Run the tests
npm test -- --watch=false

# Build the artificates 
RUN npm run build -- --output-path=./dist/out --configuration staging

# Run an nginx container
FROM nginx:1.15
COPY --from=build-stage /app/dist/out/ /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./nginx-custom.conf /etc/nginx/extra-conf.d/nginx-custom.conf
CMD ["nginx", "-g", "daemon off;"]
```

Roughly, it first installs Puppeteer, then builds the Angular artifacts, runs the tests and then creates a NGinx container. Here is my CodeBuild buildspec.yaml file
### buildspec.yaml
```yaml
version: 0.2

phases:
  install:
    commands:
      - echo '#!/bin/bash' > /usr/local/bin/ok; echo 'if [[ "$CODEBUILD_BUILD_SUCCEEDING" == "0" ]]; then exit 1; else exit 0; fi' >> /usr/local/bin/ok; chmod +x /usr/local/bin/ok
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...          
      - docker build -f $DOCKER_FILE --build-arg configuration=${CURRENT_ENVIRONMENT} -t $IMAGE .
      - "docker tag $IMAGE $REPO/$IMAGE:${CODEBUILD_BUILD_ID##*:}"
  post_build:
    commands:
      - ok && echo Build completed on `date`
      - echo Logging in to Amazon ECR...
      - $(aws ecr get-login --region $AWS_REGION --no-include-email)
      - echo Pushing the Docker image...
      - "docker push $REPO/$IMAGE:${CODEBUILD_BUILD_ID##*:}"
      - "echo {\\\"image\\\":\\\"$REPO/${CODEBUILD_BUILD_ID##*:}\\\"} > image.json"
artifacts:
  files:
    - 'image.json'
```

This buildspec file builds the image with the [Dockerfile](#dockerfile) and writes the name of the image to `image.json` file which is passed on to the next step in the pipeline which then deploys it to a ECS cluster.

When CodeBuild tries to build the docker image, the tests start  but fail to complete.

![Cannot load ChromeHeadlessNoSandbox](https://user-images.githubusercontent.com/1830246/104824893-02a51a00-584e-11eb-9380-35d89d287be2.png)

You will notice it is trying to start the browser but fails while complaining `Cannot start Chrome`. Well not very helpful is it? CodeBuild is upset but we are going to make it happy by asking our Angular App to make a few changes, so CodeBuild plays nicely again.

## Solution
One important error to notice in that error log is `Running as root without --no-sandbox is not supported.` which will give you half of the answer. Lets fix it. We need to change a few things on the Angular App configuration. 

### Update Karma.conf.js

The `karma.conf.js` file on the root folder will have Chrome configured as browser
```javascript
{
  ...
  config.set({
    ...
    browsers: ['Chrome']
    ...
  });
  ...
}
```

We need to update this to add a custom launcher. Change it to this:
```javascript
{
  ...
  config.set({
    ...
    browsers: ['Chrome', 'ChromeHeadlessNoSandbox'],
    captureTimeout: 210000,
    browserDisconnectTolerance: 3,
    browserDisconnectTimeout: 210000,
    browserNoActivityTimeout: 210000,
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--remote-debugging-port=9222',
        ]
      }
    },
    ...
  });
  ...
}
```

What we are saying here is
* We have one more browser, which is a custom launcher, which in turn is a headless browser.
* We want to increase all the timeouts so the process waits longer for all the tests to complete (If you have very limited tests, the defaults will be fine, but good to increase these anyway).
* The new headless browser we have added should run in a `no-sandbox` mode.
* We are specifying a remote debugging port as without this, Google Chrome exits immediately.

We are not done yet, we even need to update our [Dockerfile](#dockerfile) to instruct that we want to use this other browser which we just added. If you notice, we were running the tests with just the `watch` flag. Instead, we need to update line 23 in the [Dockerfile](#dockerfile) from

```yaml
npm test -- --watch=false
```

to

```yaml
npm test -- --browsers ChromeHeadlessNoSandbox --watch=false
```

That's all we need to change here. Push that change and try running your pipeline now. AWS CodeBuild should no longer complain and you should have your awesome app running like a charm, provided your tests have passed :relieved:

Angular & CodeBuild Lived Happily Ever After.