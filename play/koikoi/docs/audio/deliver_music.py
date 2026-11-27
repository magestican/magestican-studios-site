"""Deliver Hanawise's DJ music renders (HW-M3) into assets/music.

Briefs: docs/audio/music/hanawise-menu.yaml (Hanami) and hanawise-match.yaml (Matsuri).
Takes DJ's rank-1 QC-ok take of each render (japanese-traditional has no reference set yet, so QC is the only ranking;
pass --take <track>=<n> to pick another after listening). Copies the .webm byte for byte with its sound-engineer stamp
(DJ RULES J15; only the stamp's 'file' name changes), and writes assets/music/music.json with the seed, the exact loop
length and the ebur128 loudness of the copied file.

Run (from games/koikoi):  python docs/audio/deliver_music.py [--take match=2]
"""
import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

GAME = Path(__file__).resolve().parents[2]
RENDERS = Path("D:/magestican-dj/renders")
TRACKS = [
    # (track id, render folder, output name)
    ("menu", "hanawise-hw-m3-menu", "hanawise-hanami.webm"),
    ("match", "hanawise-hw-m3-match", "hanawise-matsuri.webm"),
]


def ebur128(path: Path) -> tuple[float, float]:
    out = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128", "-f", "null", "-"],
                         capture_output=True, text=True, check=True).stderr
    tail = out[out.rfind("Summary:"):]
    return (float(re.search(r"I:\s+(-?[\d.]+)", tail).group(1)), float(re.search(r"LRA:\s+([\d.]+)", tail).group(1)))


def main(argv: list[str]) -> int:
    takes = dict(a.split("=", 1) for a in argv if "=" in a)
    out_dir = GAME / "assets" / "music"
    out_dir.mkdir(parents=True, exist_ok=True)
    tracks = []
    for tid, folder, out_name in TRACKS:
        rdir = RENDERS / folder
        report = json.loads((rdir / "report.json").read_text(encoding="utf-8"))
        manifest = json.loads((rdir / "music.json").read_text(encoding="utf-8"))
        ok = [c for c in report["candidates"] if c["qc"]["ok"]]
        if not ok:
            print(f"{tid}: no QC-ok take in {rdir}", file=sys.stderr)
            return 1
        if tid in takes:
            want = f"-{takes[tid]}"
            ok = [c for c in ok if Path(c["outputs"]["webm"]).stem.endswith(want)]
            if not ok:
                print(f"{tid}: take {takes[tid]} is not QC-ok", file=sys.stderr)
                return 1
        cand = ok[0]
        stem = Path(cand["outputs"]["webm"]).stem
        src = rdir / f"{stem}.webm"
        stamp = json.loads((rdir / f"{stem}.webm.engineer.json").read_text(encoding="utf-8"))
        digest = hashlib.sha256(src.read_bytes()).hexdigest()
        if stamp.get("sha256") != digest:
            print(f"{tid}: {src.name} does not match its engineer stamp", file=sys.stderr)
            return 1
        shutil.copyfile(src, out_dir / out_name)
        stamp["file"] = out_name
        (out_dir / f"{out_name}.engineer.json").write_text(json.dumps(stamp, indent=1) + "\n", encoding="utf-8")
        mt = next(t for t in manifest["tracks"] if t["id"] == stem)
        lufs, lra = ebur128(out_dir / out_name)
        tracks.append({
            "id": tid,
            "side": "A",
            "title": mt["title"],
            "genre": report["brief"]["genre"],
            "file": out_name,
            "loopSamples": mt["loopSamples"],
            "seed": cand["seed"],
            "lufs": lufs,
            "lra": lra,
        })
    (out_dir / "music.json").write_text(json.dumps(
        {"sampleRate": 48000, "source": "Magestican DJ", "tracks": tracks}, indent=2) + "\n", encoding="utf-8")
    for t in tracks:
        print(t["id"], t["file"], t["seed"], t["lufs"])
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
