---
title: On the politics of pose tracking
date: 2026-04-12
type: essay
author: NQ Smith
summary: Calibration is never neutral. Notes on consent, defaults, and what a body in WebXR is allowed to be.
strands: kindred, vitalis
---

A headset is a survey instrument before it is anything else. It surveys the room, then the user — head, hands, sometimes the gaze, sometimes the face. The act of pose tracking is so well-rehearsed by now that we treat it as plumbing, but plumbing is precisely the thing that decides what flows where. In WebXR the plumbing is short, fast, and almost completely invisible to the person being measured.

This is the bit I keep coming back to. The defaults are a politics: a sensor stack tuned to a particular kind of body, calibrated against a particular set of ergonomic assumptions, and surfaced to developers as a clean, dimensionless skeleton. The cleanness is the problem. It hides the choices.

## What a calibration step is for

Most rigs offer a calibration: hold the controllers at your sides, look at this dot, stretch your arms wide. We tell ourselves this is for tracking quality. It is, partly. It is also, more quietly, a moment of negotiated consent. The user is being asked to lend a body to a model of bodies. If the model is wrong about that body — if the user is shorter than the assumed range, has limited shoulder mobility, uses one hand only — the calibration is where the cost of those assumptions surfaces.

The cost has two halves. First: tracking degrades for people the engineers didn't picture. Second: nothing in the calibration step tells the user *what* is being lent, *for how long*, or *to whom*. A consent surface that looks like a tutorial isn't really a consent surface.

> The calibration step is doing two jobs — making the avatar work, and making the user agree — and we have only ever resourced it for the first.

## A small clarifying type

When I sketch out a tracking pipeline I find it helps to write down the joint names I actually trust the platform to give me, separately from the ones I'm willing to *infer*. Otherwise it's easy to drift into pretending the data is denser than it is.

```ts
// Joints we get directly from WebXR's hand-tracking input source.
// Anything else (elbow, shoulder, torso) is a derived guess and
// should be treated as such by the consuming code.
type JointKey =
  | 'wrist'
  | 'thumb-tip'
  | 'index-finger-tip'
  | 'middle-finger-tip'
  | 'ring-finger-tip'
  | 'pinky-finger-tip'

interface TrackedJoint {
  key: JointKey
  position: [number, number, number]
  radius: number
}
```

Writing it this narrowly forces an honest answer to the question *what does the headset actually know about this person?* It turns out the answer is: not very much, and a great deal of the avatar is confabulation on top of six landmarks.

## What I'd like to see

Three small things, all cheap.

A calibration screen that distinguishes between *fit* (does the model match this body well enough to track it?) and *agreement* (do you understand what this lets the application see, and is that okay?). Right now those two questions wear the same dot on the same wall, which doesn't serve either of them.

A way to tell the system, mid-session, *I'm done having this measured.* Pose tracking is recoverable from gracefully — most engines tolerate a hand dropping out for a moment — but we almost never expose that as a user-facing affordance. We should.

And a habit, mostly an authoring one: name the assumed body before you ship. Write the range of heights, hands, and ranges of motion you tested. Treat the avatar rig as something with a documented domain, not an invisible default. The defaults are a politics. The least we can do is print them on the box.
