#!/usr/bin/env python3
"""Render the ordered Episode 05 storyboard into a vertical motion-comic MP4."""
from pathlib import Path
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
STORY = ROOT / "produksi" / "storyboard"
AUDIO = ROOT / "produksi" / "voice-over" / "Eps 05.mp3"
OUT_DIR = ROOT / "output"
OUT = OUT_DIR / "EMPAT-ORANG-EPS05-RUANGAN-DI-BALIK-LEMARI.mp4"
FILES = [STORY / f"IMG_{n}.jpeg" for n in range(range_start := 2889, 2898)]
W, H, FPS = 1080, 1920, 30
TRANSITION = 0.35

def run(args):
    subprocess.run(args, check=True)

def probe_duration(path):
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "json", str(path)],
        check=True, capture_output=True, text=True
    )
    return float(json.loads(result.stdout)["format"]["duration"])

def main():
    missing = [str(p) for p in FILES + [AUDIO] if not p.is_file()]
    if missing:
        raise SystemExit("Missing Episode 05 source files:\n" + "\n".join(missing))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    duration = probe_duration(AUDIO)
    if not 80 <= duration <= 130:
        print(f"WARNING: source audio is {duration:.2f}s; expected approximately 90–120s.")

    segment = (duration + TRANSITION * (len(FILES) - 1)) / len(FILES)
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "warning"]
    for p in FILES:
        cmd += ["-loop", "1", "-framerate", str(FPS), "-t", f"{segment:.6f}", "-i", str(p)]
    cmd += ["-i", str(AUDIO)]
    # Two restrained generated ambience layers; dialogue/music in the source MP3 remains primary.
    cmd += ["-f", "lavfi", "-t", f"{duration:.6f}", "-i",
            f"sine=frequency=48:sample_rate=48000:duration={duration:.6f}"]
    cmd += ["-f", "lavfi", "-t", f"{duration:.6f}", "-i",
            f"anoisesrc=color=pink:amplitude=0.008:sample_rate=48000:duration={duration:.6f}"]

    filters = []
    for i in range(len(FILES)):
        # Fill portrait frame without letterboxing, then add slow deterministic camera movement.
        # Alternate gentle push/pull directions; keep the original storyboard composition recognizable.
        zoom = "min(1+on*0.00016,1.055)" if i % 2 == 0 else "max(1.055-on*0.00016,1.0)"
        x = "iw/2-(iw/zoom/2)"
        y = "ih/2-(ih/zoom/2)"
        filters.append(
            f"[{i}:v]scale=1200:2134:force_original_aspect_ratio=increase,"
            f"crop=1200:2134,zoompan=z='{zoom}':x='{x}':y='{y}':d=1:"
            f"s={W}x{H}:fps={FPS},setsar=1,"
            f"eq=brightness='0.012*sin(t*7)':contrast=1.035[v{i}]"
        )

    current = "v0"
    current_duration = segment
    for i in range(1, len(FILES)):
        out_label = f"x{i}"
        offset = current_duration - TRANSITION
        filters.append(
            f"[{current}][v{i}]xfade=transition=fade:duration={TRANSITION}:"
            f"offset={offset:.6f}[{out_label}]"
        )
        current = out_label
        current_duration += segment - TRANSITION

    voice_idx = len(FILES)
    low_idx = voice_idx + 1
    noise_idx = voice_idx + 2
    filters.append(
        f"[{low_idx}:a]lowpass=f=95,volume=0.12[low];"
        f"[{noise_idx}:a]highpass=f=350,lowpass=f=1600,volume=0.035[air];"
        f"[{voice_idx}:a]aresample=48000,volume=1.0[main];"
        f"[main][low][air]amix=inputs=3:duration=first:dropout_transition=2,"
        f"loudnorm=I=-17:TP=-1.5:LRA=9,afade=t=out:st={max(0,duration-1.4):.3f}:d=1.4[aout]"
    )
    cmd += ["-filter_complex", ";".join(filters),
            "-map", f"[{current}]", "-map", "[aout]",
            "-t", f"{duration:.6f}", "-r", str(FPS),
            "-c:v", "libx264", "-preset", "medium", "-crf", "19",
            "-pix_fmt", "yuv420p", "-profile:v", "high",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            "-movflags", "+faststart", str(OUT)]
    run(cmd)

    check = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "format=duration:stream=codec_type,codec_name,width,height,r_frame_rate",
         "-of", "json", str(OUT)],
        check=True, capture_output=True, text=True
    )
    metadata = json.loads(check.stdout)
    video = next(s for s in metadata["streams"] if s["codec_type"] == "video")
    audio = next(s for s in metadata["streams"] if s["codec_type"] == "audio")
    if (video.get("width"), video.get("height")) != (W, H):
        raise SystemExit(f"Wrong dimensions: {video}")
    if video.get("codec_name") != "h264" or audio.get("codec_name") != "aac":
        raise SystemExit("Unexpected output codec.")
    print(json.dumps({"file": str(OUT), "duration": metadata["format"]["duration"],
                      "video": video, "audio": audio}, indent=2))

if __name__ == "__main__":
    main()
