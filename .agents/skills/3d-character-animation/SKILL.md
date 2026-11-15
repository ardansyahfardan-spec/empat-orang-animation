---
name: 3d-character-animation
description: Create readable, continuous stylized 3D character performances, posing, locomotion, gestures, and reactions for EMPAT ORANG.
---

# 3D Character Animation

Use this skill whenever building or revising character rigs, movement, poses, expressions, or acting.

## Required workflow
1. Inspect the current character models, rig structure, proportions, materials, and animation system before editing.
2. Preserve each character's identity and silhouette across every shot. Do not redesign characters between scenes.
3. Animate with clear key poses, anticipation, action, follow-through, and settling. Avoid linear robotic motion.
4. Give each character purposeful body language: head turns, eye-line direction, weight shifts, hand gestures, breathing, and reactions.
5. Locomotion must visibly move the character through the scene; coordinate footfalls and body bounce to avoid sliding.
6. Use shot-specific acting. Characters should react to what they hear or see, not simply loop idle animation.
7. Keep animation deterministic and seekable: the same timeline timestamp must produce the same pose. Avoid dependence on accumulated frame delta.
8. Provide fallback poses and validate all character actions at scene boundaries and during scrubbing.

## Character continuity
- Tio: male, slightly longer hair, earrings, band T-shirt.
- Bila: female, hijab, shorter/smaller than Yhola.
- Yhola: female, pashmina/hijab and blazer, slim, nearly Ardan's height.
- Ardan: male, short hair, plain black T-shirt.

Do not swap names, outfits, height relationships, or character positions without story justification. Keep stylized proportions coherent and avoid blocky placeholder appearance in final shots.

## Validation
Review walk cycles, contact points, hand poses, facial direction, clipping, intersections, and continuity in representative frames from every scene.
