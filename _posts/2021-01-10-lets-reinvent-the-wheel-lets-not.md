---
layout: post
title:  "Let's reinvent the wheel.. Yes! Let's build a search platform like Google.. LET'S NOT!"
date:   2021-01-10 20:00:00 +0000
image:  "https://user-images.githubusercontent.com/1830246/103958486-05648880-5145-11eb-98b0-7b8e5727540a.jpg"
tags:   Tech Development Planning
category: General
author: paragnair
featured: true
hidden: true
---

Have you come across the statement "Don't reinvent the wheel"? Yes, we definitely know what it means, but as a Developer, you WANT to reinvent it, don't you?

A word of advice, when your Developer brain says "We can build this", just take some time to assess if, what you want to build adds any value over what is already tried and tested.

Let me take you down my memory lane. There was a time when I was purely a Developer (still in my mind I am), and we had this roadmap meeting where the next feature we wanted in our system was Blogs. As soon as we understood the requirement, my brain already started coding it. I had database schema mapped up, the UML diagram started flashing, some nerves within that brain fired messages which particularly started with the statement "It will be great to have...". I was excited and just wanted to get my hands on building this module.

Then there was this voice across the table - "Lets look at the documentation and pricing for some Community Blogs that are available in the market to plug into our system." It was Thomas, a new manager recruit whom I had hardly worked with. The developer within me heard it as "I do not trust our development team and hence we should get this work outsourced". All my enthusiasm came to a griding halt. I immedeately ran the `DROP DATABASE` command for the beautiful schema which I had built within my brain in a span of few minutes.

My next 15 mins were spent trying to convince the management that we have a strong development team with qualified engineers who can build this system. Everyone in the room listened to me patiently and acknowledged my enthusiasm and the trust in the development team.

The next day I had a long conversation with Thomas who tried to explain me the the difficulties and time-constraints building a system which already exists, test it, fix issues and go through an iteration process. My developer brain kept refusing to understand because a developer <strong>JUST WANTS TO BUILD IT</strong>.

Fast-forward 5 years down the line, I came across situations where the team decided to build things rather than choosing an existing solution and then spend days trying to fix and un-fix stuff. The lessons I have learnt over the years have been:

* If time is a constraint, its best to go for a pre-built tried & tested solution.
* Your valuable development time is better spent on solving business problems than building a system just because you want to get your hands dirty in code & it sounds exciting.
* If you have an idea and you forge ahead without planning, you will end up adding things which you think might be used, but will never be used. This is one of the reasons I am a strong advocate of <strong>Test Driven Development</strong> aka <strong>TDD</strong> where you write your tests first and then develop against them. This ensures you are building only what is required.
* When you have an idea, its best to get it out there as soon as possible. The sooner it is out there, the sooner you will get feedback and understand if the idea has any mileage. You can then have an iterative feedback loop to improve it.

The questions I would ask myself are:

* Do you really have a massive team which can build this feature in the time frame expected?
* Are you adding anything that other tried and tested system does not have. If the answer is yes, is this feature really important? Does it translate to conversion of potential customers or it is a <strong>Good To Have feature?</strong> If the answer to that question is <strong>Good To Have</strong>, then your response should be, <strong>Let's Not Build It</strong>.

If I had a time machine, I would go back to that time and convince <strong>myself</strong> not to try and convince the management to build the Blogging system ground up. As a developer, you will always want to build things as that is your adrenaline & gives you a sense of achievement, but there are other sides to it, the business side, the logical side, the feasability side. Just asses everything before you dive into code, you do not want to regret spending time on something which might not have a long shelf-life. 

I will leave you with this excellent quote which I came across:

> Don't reinvent the wheel, just realign it. <cite>- Anthony J. D'Angelo</cite>