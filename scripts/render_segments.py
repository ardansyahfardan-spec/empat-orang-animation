#!/usr/bin/env python3
"""Render EMPAT ORANG in short, isolated HyperFrames segments and join them.

Each segment gets a fresh Chrome process and a short composition window. This
avoids holding one WebGL/Chrome render session open for all 2,760 frames.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "hyperframes-project"
OUTPUT = ROOT / "output"
FPS = 30
RENDER_WIDTH = 540
RENDER_HEIGHT = 960
SEGMENTS = [(0, 23), (23, 46), (46, 69), (69, 92)]


def run(command: list[str], *, cwd: Path | None = None, timeout: int = 720) -> str:
    print("+", " ".join(map(str, command)), flush=True)
    completed = subprocess.run(
        command, cwd=cwd, text=True, stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT, timeout=timeout, check=False
    )
    print(completed.stdout[-12000:], flush=True)
    if completed.returncode:
        raise RuntimeError(f"Command failed ({completed.returncode}): {' '.join(command)}")
    return completed.stdout


def patch_segment(segment_project: Path, start: int, end: int) -> None:
    index_path = segment_project / "index.html"
    index = index_path.read_text(encoding="utf-8")
    index, n_root = re.subn(
        r'(<div id="root" data-composition-id="main" data-start="0" data-duration=")92(")',
        rf'\g<1>{end - start}\2', index, count=1
    )
    index, n_host = re.subn(
        r'(<div id="episode" data-composition-id="episode" data-composition-src="compositions/episode.html" data-start="0" data-duration=")92(")',
        rf'\g<1>{end - start}\2', index, count=1
    )
    if n_root != 1 or n_host != 1:
        raise RuntimeError("Could not safely shorten the root and episode host durations.")

    def patch_audio(match: re.Match[str]) -> str:
        tag = match.group(0)
        tag = re.sub(r'data-duration="[^"]+"', f'data-duration="{end - start}"', tag)
        if 'data-media-start="' in tag:
            tag = re.sub(r'data-media-start="[^"]+"', f'data-media-start="{start}"', tag)
        else:
            tag = tag[:-1] + f' data-media-start="{start}">'
        return tag

    index, audio_count = re.subn(
        r'<audio\b[^>]*\bid="(?:narration|score|ambience)"[^>]*>',
        patch_audio, index
    )
    if audio_count != 3:
        raise RuntimeError(f"Expected 3 audio tracks, found {audio_count}.")
    index = index.replace('data-width="1080" data-height="1920"', f'data-width="{RENDER_WIDTH}" data-height="{RENDER_HEIGHT}"')
    index_path.write_text(index, encoding="utf-8")

    scene_path = segment_project / "compositions" / "episode.html"
    scene = scene_path.read_text(encoding="utf-8")
    root_marker = '<div id="root" data-composition-id="episode" data-width="1080" data-height="1920">'
    if root_marker not in scene:
        raise RuntimeError("Could not find the episode composition root.")
    scene = scene.replace(
        root_marker,
        f'<div id="root" data-composition-id="episode" data-width="{RENDER_WIDTH}" data-height="{RENDER_HEIGHT}" data-segment-offset="{start}">',
        1
    )
    scene = scene.replace(
        'const canvas=document.querySelector("#world"),line=document.querySelector("#line"),sub=document.querySelector("#subline");',
        'const SEGMENT_OFFSET=Number(document.querySelector("[data-segment-offset]").dataset.segmentOffset||0);\nconst canvas=document.querySelector("#world"),line=document.querySelector("#line"),sub=document.querySelector("#subline");',
        1
    )
    scene = scene.replace(
        'window.addEventListener("hf-seek",e=>renderAt(e.detail.time));',
        'window.addEventListener("hf-seek",e=>renderAt(e.detail.time+SEGMENT_OFFSET));',
        1
    )
    scene = scene.replace('renderer.setSize(1080,1920,false)', f'renderer.setSize({RENDER_WIDTH},{RENDER_HEIGHT},false)', 1)
    scene = scene.replace('new THREE.PerspectiveCamera(39,1080/1920,.1,180)', f'new THREE.PerspectiveCamera(39,{RENDER_WIDTH}/{RENDER_HEIGHT},.1,180)', 1)
    scene = scene.replace('renderAt(0);', 'renderAt(SEGMENT_OFFSET);', 1)
    scene = scene.replace('onUpdate:()=>renderAt(tl.time())', 'onUpdate:()=>renderAt(tl.time()+SEGMENT_OFFSET)', 1)
    if "SEGMENT_OFFSET" not in scene or 'renderAt(e.detail.time+SEGMENT_OFFSET)' not in scene:
        raise RuntimeError("Failed to apply the scene time offset.")
    scene_path.write_text(scene, encoding="utf-8")


def probe(path: Path) -> dict:
    raw = run([
        "ffprobe", "-v", "error", "-show_entries",
        "format=duration:stream=codec_type,codec_name,width,height,r_frame_rate",
        "-of", "json", str(path)
    ], timeout=60)
    return json.loads(raw)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    parts_dir = OUTPUT / "segments"
    if parts_dir.exists():
        shutil.rmtree(parts_dir)
    parts_dir.mkdir(parents=True)

    with tempfile.TemporaryDirectory(prefix="empat-orang-segments-") as temp:
        temp_root = Path(temp)
        part_files: list[Path] = []
        for number, (start, end) in enumerate(SEGMENTS, 1):
            segment_project = temp_root / f"part-{number:02d}"
            shutil.copytree(
                PROJECT, segment_project,
                ignore=shutil.ignore_patterns(".hyperframes", "node_modules", "renders")
            )
            patch_segment(segment_project, start, end)
            part_file = parts_dir / f"part-{number:02d}.mp4"
            run([
                "npx", "--yes", "hyperframes", "render",
                "--workers", "1", "--fps", str(FPS), "--quality", "standard",
                "--output", str(part_file)
            ], cwd=segment_project, timeout=720)
            if not part_file.is_file() or part_file.stat().st_size < 100_000:
                raise RuntimeError(f"Segment {number} is missing or unexpectedly small.")
            metadata = probe(part_file)
            duration = float(metadata.get("format", {}).get("duration", 0))
            video = next((s for s in metadata.get("streams", []) if s.get("codec_type") == "video"), None)
            audio = next((s for s in metadata.get("streams", []) if s.get("codec_type") == "audio"), None)
            if not video or not audio:
                raise RuntimeError(f"Segment {number} is missing video or audio.")
            if (video.get("width"), video.get("height")) != (RENDER_WIDTH, RENDER_HEIGHT):
                raise RuntimeError(f"Segment {number} has unexpected dimensions: {video}.")
            if abs(duration - (end - start)) > 0.25:
                raise RuntimeError(f"Segment {number} duration is {duration:.3f}s, expected {end-start}s.")
            print(f"Verified part {number}: {duration:.3f}s, {RENDER_WIDTH}x{RENDER_HEIGHT}, {video.get('r_frame_rate')}, audio present.", flush=True)
            part_files.append(part_file)

    concat_file = parts_dir / "concat.txt"
    concat_file.write_text(
        "".join(f"file '{p.resolve().as_posix()}'\n" for p in part_files),
        encoding="utf-8"
    )
    final_file = OUTPUT / "empat-orang-ep01.mp4"
    run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_file),
        "-vf", f"scale=1080:1920:flags=lanczos", "-r", str(FPS),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(final_file)
    ], timeout=300)

    final_meta = probe(final_file)
    duration = float(final_meta.get("format", {}).get("duration", 0))
    streams = final_meta.get("streams", [])
    video = next((s for s in streams if s.get("codec_type") == "video"), None)
    audio = next((s for s in streams if s.get("codec_type") == "audio"), None)
    if not video or not audio or (video.get("width"), video.get("height")) != (1080, 1920):
        raise RuntimeError("Final MP4 failed stream/dimension verification.")
    if abs(duration - 92) > 0.35:
        raise RuntimeError(f"Final MP4 duration is {duration:.3f}s, expected 92s.")
    print(
        f"FINAL VERIFIED: {final_file} | {duration:.3f}s | "
        f"{video.get('width')}x{video.get('height')} | {video.get('r_frame_rate')} | "
        f"video={video.get('codec_name')} audio={audio.get('codec_name')}",
        flush=True
    )


if __name__ == "__main__":
    main()
