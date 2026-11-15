---
name: indonesian-narrator-tts
description: Prepare natural Indonesian narration, TTSMaker voice settings, segmented speech generation, and synchronized audio integration.
---

# Indonesian Narrator & TTS

Use whenever writing narration for voiceover, generating TTS audio, or integrating narration into the episode.

## Voice direction
- Target: Indonesian male narrator, low/mature register, mysterious but natural and clearly articulated.
- Delivery: measured suspense, varied emphasis, natural pauses, no flat robotic cadence.
- Preserve Indonesian pronunciation, names, punctuation, and emotional intent.
- Avoid overacting, excessive whispering, and unnaturally slow pacing.

## TTSMaker workflow
1. Treat TTSMaker as the requested preferred provider for this project.
2. Check the current service's supported Indonesian voices, free character limits, export format, and usage terms before generating.
3. If length limits apply, split narration at complete sentence/paragraph boundaries and keep identical voice and settings across chunks.
4. Name chunks in timeline order, normalize format/sample rate, and concatenate with short natural pauses.
5. Keep the original text and a manifest of chunk order/settings in the repository.
6. Only label audio as TTSMaker-generated after the actual exported TTSMaker audio is present in the project and used by the render.

## Integration and honesty
- Expected final asset path: `hyperframes-project/assets/narration.wav` (or a documented MP3 source converted during render).
- Do not fabricate, synthesize a fake TTSMaker result, or claim a provider was used without its real output.
- Do not silently replace TTSMaker with eSpeak or another voice. If TTSMaker cannot be accessed or its free quota is insufficient, document the blocker and report the alternative clearly before treating it as final.
- Never ask the user to pay for a tool or service without explicit approval. Prefer free options.
- Align narration to the storyboard; leave intentional pauses for visual reveals and dialogue.
