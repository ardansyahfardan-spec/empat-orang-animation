# EMPAT ORANG — Reusable 3D HTML Pipeline

This folder is the new browser-based pipeline foundation. It does not replace the existing `hyperframes-project/EMPAT-ORANG-EP01.html`.

## Current foundation
- Three.js browser renderer and GLTFLoader.
- GLB character loading with temporary placeholders when files are absent.
- Reusable actor registry for Zio, Erla, Olaf, and Den.
- AnimationMixer registry for clips embedded in loaded GLB files.
- Episode JSON manifest for scene timing, captions, camera, and actor actions.
- Narration audio is the master clock; visual scene selection reads `audio.currentTime`.
- Playback speed control uses actual playback-rate values.

## Required assets (not included yet)
Place these files at the repository root under `assets/`:
- `assets/characters/zio.glb`
- `assets/characters/erla.glb`
- `assets/characters/olaf.glb`
- `assets/characters/den.glb`
- `assets/environments/desa.glb` (next environment-loader stage)
- `assets/audio/elevenlabs/narration-elevenlabs.mp3`

Character GLB files should contain a humanoid skeleton. Facial morph targets or a compatible facial rig are recommended for expressions and lip-sync. Animation clips can be embedded in each character GLB or loaded as separate GLB animation libraries in a later stage.

## Preview
Serve the repository through a static web server or GitHub Pages. Opening the HTML directly with `file://` may block module imports and JSON fetches. Open `pipeline/index.html` over HTTPS instead.

## Next implementation steps
1. Verify the player with one real rigged GLB character.
2. Add environment GLB loading and reusable animation-library loading.
3. Map all EP01 scene boundaries to the actual narration audio.
4. Add facial expressions, lip-sync, and character visibility/position tracks.
5. Add an episode editor for authoring scene JSON without editing JavaScript.

The current EP01 manifest contains provisional scene timings, not verified dialogue timestamps.