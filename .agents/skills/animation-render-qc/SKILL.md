---
name: animation-render-qc
description: Validate HyperFrames projects, render complete MP4 episodes, and perform visual, timing, audio, and artifact quality checks.
---

# Animation Render & Quality Control

Use before every production render and before delivering any MP4.

## Preflight
- Read the HyperFrames skill and relevant references first.
- Validate project structure, composition IDs, timeline duration, assets, fonts, external dependencies, and audio paths.
- Run the project's HyperFrames lint/validation command and resolve errors. Record warnings and decide whether they affect output.
- Confirm every timed scene has real animated visual content. No missing timeline segments or accidental blank/frozen holds.
- Ensure animation is deterministic and can render at arbitrary timestamps.

## Render
- Use the repository's documented HyperFrames CLI and workflow. Keep output settings at 1080x1920, 30 fps, vertical 9:16 unless the episode spec changes.
- Fail the workflow on lint errors, missing assets, render errors, invalid duration, or failed media probes.
- Never conceal a short visual render by cloning the final frame to fill the target duration.
- Keep logs and clear failure messages for diagnosis.

## Post-render verification
1. Use ffprobe to verify codec, dimensions, frame rate, duration, audio stream, and file integrity.
2. Inspect frames from the beginning, middle, end, and every major scene transition. Check for freezes, blank frames, clipping, and inconsistent characters.
3. Verify narration, music, ambience, and SFX are present and synchronized.
4. Confirm the GitHub Actions artifact exists and can be retrieved before saying the MP4 is ready.
5. State known limitations honestly. A successful workflow alone does not prove the episode is visually satisfactory.

## Delivery
Provide the verified artifact link and concise render specifications. Never call an MP4 final if visual review, audio review, or artifact verification is incomplete.
