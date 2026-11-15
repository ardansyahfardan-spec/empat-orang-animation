# Storyboard — Episode 01

The cut list and timings are defined in [SPEC.md](SPEC.md). Every scene must have a visible action and a motivated camera choice; avoid static holds longer than the intended suspense beats. The opening frame must already contain the hook, not black. Captions and key action remain inside the vertical safe area.

## Production notes
- Build one sub-composition per scene, all sharing the same character rig and environment helpers.
- Character animation is keyed from timeline time: head leads, shoulders and arms follow, feet maintain ground contact.
- Three.js must redraw from the HyperFrames `hf-seek` event; do not use requestAnimationFrame, Date.now, timers or unseeded randomness.
- Render samples must be inspected at the opening hook, first group shot, upstairs apparition, door opening, flashlight reveal and final whisper.
