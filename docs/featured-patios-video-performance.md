# Featured patios — video performance gating

The featured-patios carousel on the home page can render each card's preview as a **scrubbable video**: as the carousel moves, the video's playhead follows the scroll position, so the card animates in step with the user's cursor.

That effect is expensive. It decodes video and repeatedly seeks it, several cards at a time. On underpowered hardware it stutters badly enough to make the whole page feel broken — worse than not having the effect at all. So the app decides, per visitor, whether to use video or fall back to the static preview image.

This document explains how that decision is made, what the fallback looks like, and how to verify the behaviour.

## What the visitor sees

There are two presentations, and every visitor gets one of them:

|  | Video enabled | Video disabled (fallback) |
| --- | --- | --- |
| Card media | Preview video, playhead follows the carousel | Static high-resolution preview image |
| Cursor-driven carousel scrolling | Yes | **Yes — always** |
| Card content, links, layout | Identical | Identical |

The fallback is not a degraded page. It is the same carousel with the same imagery, minus the video animation. Nothing becomes unavailable or unreachable.

**Cursor-driven scrolling is never disabled for performance reasons.** Moving the cursor across the carousel scrolls it, on every device, whether or not video is enabled. It is navigation, not decoration, so it is deliberately excluded from all of the gating below. Its only two off-switches are touch devices (no cursor exists) and the visitor's own reduced-motion preference.

## How the decision is made

Two checks run in sequence. Video needs **both** to pass — this is deliberately an AND, not an either-or.

### 1. Up-front device check (instant, no measurement)

Runs once, before anything is downloaded. It exists to spare obviously unsuitable devices from ever fetching a video. Video is skipped when any of the following is true:

| Condition | Reason |
| --- | --- |
| Touch device / no mouse cursor | The effect is driven by cursor position; there is nothing to drive it |
| 4 CPU cores or fewer | Low-end phones, tablets, older ultrabooks |
| 4 GB RAM or less | Each mounted card holds its video in memory; several are mounted at once |
| Slow connection, or "Data Saver" enabled | Downloading video would be hostile on a metered or slow link |
| Browser "reduce motion" accessibility setting is on | The visitor has explicitly asked for less animation |

Two notes on reliability. Not every browser reports core count, memory or connection quality — when a value is unavailable it is treated as _unknown, allow_, and the decision falls through to the measured check below. And because these values are fixed properties of the device, this check returns the same answer on every page load. It is fully deterministic.

### 2. Measured performance check (the source of truth)

Reported specs only approximate real performance, so the app also measures what is actually happening and turns video off if it cannot keep up. Two independent signals are watched, because performance can fail in two different places:

- **Main thread** — how long each animation frame takes. Catches a CPU that cannot keep up with the page's own work.
- **Video pipeline** — the share of decoded video frames the browser drops before displaying them. Catches a weak GPU or video decoder. This matters because video decoding and compositing happen _outside_ the main thread: a slow GPU can be dropping a third of its frames while the main thread still looks perfectly healthy. Watching only the main thread would miss precisely the devices this feature is meant to protect.

If either signal breaches its budget, video is switched off, cards revert to their static images, and the scroll-scrub listener is torn down.

#### Thresholds

| Setting                                | Value                                                     |
| -------------------------------------- | --------------------------------------------------------- |
| Frame-rate floor                       | 45 fps (measured at the 90th percentile, not the average) |
| Measurement window                     | 60 consecutive frames (~1 second)                         |
| Consecutive breaching windows required | 3                                                         |
| Dropped video frames tolerated         | 20%                                                       |
| Minimum decoded frames before judging  | 60                                                        |

#### Why the verdict is stable

An earlier version of this check could reach different conclusions on consecutive reloads of the same page on the same machine — video would appear one time and not the next. That is a confusing failure: a perfectly capable device showing no video. Four rules exist specifically to prevent it.

1. **Measurement never starts during page load.** It waits for the document to finish loading, then a further 1.5 seconds. Page load is the least representative moment there is — network requests, first video decodes, image decodes and app startup all land at once. Judging a device by that window judges the load, not the device.
2. **Each measurement session discards its first 45 frames** as warm-up, for the same reason.
3. **One slow second is never enough.** Three consecutive breaching windows are required. A single hiccup — a background tab waking up, a garbage collection pause — cannot switch video off. A capable device recovers within a window and the counter resets to zero.
4. **The verdict is remembered for the browser tab session.** Once video has been confirmed too slow, reloading the page keeps that answer instead of re-rolling it. Opening a new tab measures again from scratch.

Additional safeguards: frames measured while the browser tab is hidden or in the background are discarded, and pauses longer than one second are treated as the device sleeping rather than as jank.

#### Direction of the decision

Within a tab session the decision only ever moves one way: video on → video off. It does not flip back and forth while the visitor is on the page. A carousel that keeps switching between presentations is more distracting than either presentation on its own.

The consequence, stated plainly: a genuinely slow device shows a few seconds of stuttering video before the app concludes it cannot cope and switches to images. This is the accepted cost of not falsely disabling the effect on capable hardware. The up-front device check is what keeps that window short for the clearest cases, since those devices never start a video at all.

## Verifying the behaviour

### Confirming video works

Open the home page on a desktop machine with a mouse and move the cursor across the featured carousel. The cards should scroll, and their imagery should animate in step with the movement.

### Confirming the fallback works

In Chrome DevTools, **Performance** panel → **CPU** → **20× slowdown**, then scrub the carousel continuously for about five seconds. Video switches off and the cards revert to static images.

Two things to know before testing this way:

- **4× and 6× slowdown will not disable video, and that is correct.** Chrome's CPU throttling slows only the main thread; video decoding and the GPU are untouched. Since the video path is genuinely still fast at those settings, the app correctly leaves it on. The check reports measured performance, not a synthetic slowness label.
- **Clear the remembered verdict between test runs.** In DevTools → Application → Session Storage, delete the `featured-patios:video-perf-degraded:v1` key. Otherwise a previous run's result carries over and the next test reads as immediate.

### Testing the individual up-front conditions

| Condition                    | How to trigger in Chrome DevTools                                       |
| ---------------------------- | ----------------------------------------------------------------------- |
| Slow connection              | Network panel → throttle to **Slow 3G**, then reload                    |
| No cursor / touch device     | Toggle the device toolbar (mobile emulation)                            |
| Reduced motion               | Rendering panel → **Emulate CSS prefers-reduced-motion**                |
| Weak GPU / video decoder     | Launch Chrome with `--use-gl=swiftshader` (software rendering)          |
| Low core count or low memory | Not emulable — needs real hardware, or a VM/container limited to 2 CPUs |

Core count and memory are read directly from the device and cannot be faked from DevTools. Testing those two conditions requires genuinely constrained hardware.

## Where this lives in the code

| File | Role |
| --- | --- |
| `src/modules/Home/components/FeaturedPatios/utils/detectDeviceSeed.ts` | Up-front device check (cores, memory) |
| `src/modules/Home/components/FeaturedPatios/hooks/useVideoPerfGuard.ts` | Measured performance check, both signals |
| `src/modules/Home/components/FeaturedPatios/hooks/useFeaturedCarousel.ts` | Combines the checks into `videoCapable` / `motionCapable` |
| `src/modules/Home/components/FeaturedPatios/index.tsx` | Applies the flags to the carousel and its cards |
| `src/modules/Home/components/FeaturedPatioCard/hooks/useHoverVideoScrub.ts` | Per-card video loading and playhead control |

`videoCapable` gates video mounting and the scroll-scrub listener. `motionCapable` gates cursor-driven scrolling and, as described above, is intentionally independent of every performance signal.
