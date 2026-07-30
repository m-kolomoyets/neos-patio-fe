====
Hi, Thanks for feedback pints, will work it out and take them as top priority.

To start with - would like to clarify the assers links for Todai-Ji pato.

As far as I know, the pattern of asset manageent is:

card low res image:  https://patiostorage.blob.core.windows.net/assets/<PATIO_NAME>-preview-low.jpg
card full res image: https://patiostorage.blob.core.windows.net/assets/<PATIO_NAME>-preview.jpg


But the Todai-ji is an exception. This patio seems not to ave full res preview image.

The link without the preview  suffix is the background picture.
Could you please clarify whether it is stored in another location or whether it exists in your bucket.

Thanks in advance
===
@Karel
Hi everyone, hope you are doing good.

If I am no at the call and you are reading this message - then my dentist visit is taking more time than expected.
But it will not stop me from delivering the updates):typingcat:

I have recorded the demos of such updates:

Mobile responsive view for home and patio view pages
More logic in create patio flow.


The demonstration was divided into 2 parts - first video i about responsive design, second one - about create patio.
Thanks in advance, and looking forward to your feedback!)

See you next time in a week!):raised_hands:
@Sofiia Pitenko cc
===
Hi, Hope you are doing good.
Providing the repository link so you will have access to all the code. https://github.com/m-kolomoyets/neos-patio-fe/tree/dev

The branch has latest updates is named dev

Before starting the project, please upload the environment variables from the attachment to the root of the project.

Quick start instructions and commands to execute are described in readme.md.

PLease let me know if something else is needed in addition or further assistance is required.

Thanks in advance:raised_hands:
===
I agree with you that parallax is not needed here, so we already removed this. Thumbnails scaling is reverted to normal one eventually.

Thanks for approving parallax removal:raised_hands:
===
@Karel

Hi, Hope you are doing good.

I am wondering whether we need LOD for page transitions. previewBackground  image has big resolution, and it might load not at time of patio click, as you can see in the video. Should we show low-quality version and then original one? If yes, we need new image, because previewLow and previewHigh are different than previewBackground one.

Thanks in advance
===
@Karel

I am wondering whether the azure blob cloud just stores static preview images?

Is there the possibility to add parameters into image url for getting it downscaled on azure side?
Like https://aaa.com/assets/image.jpg?w=100
Or is it possible for future? It will help us to fix the moire effect withput additional client-side calcualtions and will help us manage those images in different places in future.

It is recommended to do so, because otherwise there will be client-side downscale which will take performance

Thanks in advance :raised_hands:
===
@Karel

What about videos, Thanks for progress with optimizing the videos for parallax effects.

But it should have keypoints every 6-8 frames to be cirrectly displayed in the carousel.

I have recorded a little demo with difference of your video (stock) and optimized.

Please let me know whether it is clear or you need something
===
@Karel
Hi, Hope ypu are doing good. Thank for a detailed and structured feedback with points to move forward with better product every day.

Regrading this question:
please don't forget about my question from last week about which API are you using if you are using an API. Local tiles are of course also viable and valid interim solution for WIP.

Besically, I use hybrid system:

all patios data is local fixtures dataset (json array of objects)
Videos are stored locally inside project statis assets (because we had to re-encode videos to enable parallax)
All (preview-) prefixed images are taken from your blob bucket


Also providing the basic example of data item to have current implemented flows possible to view.
I wil be able to restructure data structures later when both home page and patio editor are ready visually, separating getting list of patios and getting single item, because currently this array of objects is single source of truth.

Please let me know if everything is clear and whether you have something to add.

Thanks in advance:raised_hands:
===
@Karel

Hi, hope ypu are doing good.

I have updated the home page paios cards with the edits were discussed during last demo.


Snapping the featured patios video by their position (attachment 1)
Vertical parallax for patio library previre images (attachment 2)


Would be perfect if you check it through the link I have provided earlier and would be glad to read your feedback about those features, whether they match your desired vision.
Thanks in advance:raised_hands:
===
Hi. Hope you are doing well.

TL;DR - Yes

At very start we implemented the Training flow, we tested and implemented the quizzes logic for training courses would be enabled as addition to videos and documents display as it is now.

However, we can return this functionality back with taking in account new requirements and desisions.

Please let us know please in details what exact structure you desire the training courses should be, and we will find it out the direction we will implement it.

Thanks in advance

@Artem Tkachyk cc
===
@Russell Holland

Hi, Hope you are doing good.

I have found out that I need to launch the production build locally with envs to debug the issue in details. The state of things I have on my machine now is not enough and my envs were not encrypted are deprecared a lot.

So could you please provide me the  .env.keys  file  to be able to launch the new package.json commands?

Thanks in advance:raised_hands:
===
@Russell Holland

Hi, Hope you are doing good.

Seems like new updates about medical plans utilize TailwindCSS. But the project uses CSS Modules as main source of styles. And styles are tokenized for comfortable use to match design guidelines.

 Thus, it makes such UI mismatch.


Could you please review the layouts with your new updates to use CSS Modules instead of TailwindCSS as Claude Code may desired.

Thanks in advance:raised_hands:
===
@Russell Creswell

Hi. Hope you are doing good.

Seems like stage of affiliate portal admin panel is absent and the https://stage-admin.getehp.com/ is not working.

Could you please clarify why stage was removed from remote ssh server? Or stage was migrated to somewhere else?

it is related to https://phenomenonstudio.slack.com/archives/C089M6V5YR4/p1771844129243739 because Anthony have added new environment variables and they must have been added to all environments for CI/CD to proceed. Currently last deploy failed.

And stage does not exist now as far as I see.

Thanks in advance for any response.
===
@Anthony Cona

Hi, Hope you are doing good.
We have just noticed that dev instance of affiliate portal admin panel is down.

I have looked at Gitlab and noticed that last updates have included the new environment variables have failed the CI/CD job because those new environment variables were not added into the .env  file stored inside the remote server.

Could you please provide the new environment variables for us to add them and re-trigger the dev deployment?

Also kindly reminding to watch matching of environment variables and please let us know if you add new ones to prevent such cases in future.
Thanks in advance.
===
@Russell Holland

Hi, Hope you are doing good.

I have noticed your recent updates in affiliate portal were merged, and would like to mention few things about new features implementations.

I understand that some features are critical and have to be implemented and be merged asap, but building the feature that way by creating some logic from scratch will take much more time and code writing rather than using prepared solutions for managing forms and its fields.

Current implementation misses accessability and error handling, and all of it is handled with prepared ui components and libraries installed in this project. And following simple rules were write iin documentation (e.g., sriting components styles in css module file) is faster and more appropriate as we have a whole ecosystem of writing application that way it was written before.

I would kindly remind to refer to documentation and other similar solutions/components/modules all over the project and maybe copy-paste some code for faster implementation. It will make UI and logic predictable, accessable, and utilizing prepared components/libraries will optimize features implementation time and prevent you thinking about some points are already implemented with them.

Thanks for understanding:raised_hands:
===
@Anthony Cona @Russell Holland

Hi. Hope you are doing good.

I noticed that the pending merge request [here] and two more [here] and [here] were merged without taking in account review comments.
I understand, if the updates were implemented in those branches were urgent, but kindly reminding to take in account review comments and hope to see those fixes in future merge requests:


• Pipeline clients accordion view - after UI testing I noticed few mismatches with a Figma layout, I have described the issues and how to fix them in this video [here], please make sure that UI part matches Figma layouts, and view toggle buttons as well.
• Updated an export csv logic comments [here].
• clients view mode change handler update and number formatting comments [here].

Thanks in advance:raised_hands:
===
