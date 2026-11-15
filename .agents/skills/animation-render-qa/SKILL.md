---
name: animation-render-qa
description: Validate motion, timing, audio, and final MP4 integrity for EMPAT ORANG animation renders.
---
# Animation Render & Quality Control

A render is not complete until the output has been inspected and verified.

## Pre-render
- Read SPEC.md, STORYBOARD.md, and the relevant HyperFrames skill references.
- Run the project's supported lint/doctor checks and fix errors that affect output.
- Verify all required assets resolve and composition timestamps are deterministic.

## Render validation
- Check MP4 dimensions, frame rate, duration, codecs, audio streams, and file size with ffprobe.
- Confirm the first, middle, and final portions contain intended animated visuals; inspect sampled frames throughout the timeline.
- Detect frozen-frame spans, missing scenes, black frames, broken camera cuts, character discontinuities, and missing assets.
- Listen/check audio duration and confirm narration, score, ambience, and key effects are present and synchronized.
- Never use last-frame cloning to disguise a short render. If visual capture ends early, fail the render and fix the cause.
- Keep logs and a concise QA report with exact measured values.

## Completion gate
Only call the MP4 final when the workflow succeeded, the artifact exists, metadata checks pass, and visual/audio inspection passes. Otherwise report the actual blocker and keep the output labeled as a preview or failed render.
