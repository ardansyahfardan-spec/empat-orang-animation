# Agent instructions — EMPAT ORANG

For every video creation, editing, animation, or render task, read `.agents/skills/hyperframes/SKILL.md` first and follow its render contract and work loop. Read the relevant references it names before implementation.

## Episode 01 production brief
- Story: EMPAT ORANG — Episode 01, “Rumah yang Memanggil”.
- Deliverable: vertical 9:16 MP4, 1080×1920, 30 fps, approximately 92 seconds or longer.
- Visual direction: stylized cinematic 3D, not 2D; consistent four main characters based on the user's supplied reference: Tio (male, longer hair, earrings, band tee), Bila (female, hijab, shorter), Yhola (female, pashmina and blazer, slim and nearly Ardan's height), Ardan (male, short hair, plain black tee).
- Editing: deliberate cut-to-cut scenes, varied shot sizes and angles, motivated camera movement, visible character actions, suspense pacing. Avoid long static shots or relying on camera movement alone.
- Sound: Indonesian male mysterious narrator, original horror score, scene-specific ambience and sound effects. The intended voice provider is TTSMaker; do not claim it is integrated until an actual TTSMaker audio file is present and used. Never silently substitute eSpeak and call it TTSMaker.
- User operates from iPhone and does not want manual terminal commands or coding instructions.
- Preserve existing story and character continuity. Do not claim a finished MP4 until the render workflow succeeds and the artifact is verified.
- Before replacing the current renderer, inspect the existing project and migrate deliberately to HyperFrames; retain Three.js where it materially helps 3D scenes. Run HyperFrames validation and review before delivery.

## Production skills
Before production work, read the HyperFrames foundation skill and the relevant specialist skills below. For a full episode pass, read all six specialist skills:
- `.agents/skills/cinematic-storyboard-director/SKILL.md`
- `.agents/skills/3d-character-animation/SKILL.md`
- `.agents/skills/cinematography-lighting/SKILL.md`
- `.agents/skills/horror-sound-design/SKILL.md`
- `.agents/skills/indonesian-narrator-tts/SKILL.md`
- `.agents/skills/animation-render-qc/SKILL.md`

Apply these as production requirements, not merely reference material. Keep TTSMaker as the preferred narrator provider, but only claim its use when its actual exported audio is integrated. Complete a storyboard-to-shot implementation audit before rendering, then perform the full render/QC workflow.
