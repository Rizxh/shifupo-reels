"""QA for a finished toon reel: specs, loudness, frame sheet, and a glitch scan.

usage: python scripts/toon/qa.py "out/video/<id> - <Title>.mp4" [out/qc/<id>]
Glitch scan (on a 180x320 copy of every frame):
  - pops: a single frame that differs from both neighbours while they match each other (a flash, a missing card)
  - whips: 3+ consecutive big jumps (an object sweeping past the lens, a too-fast camera move)
Both lists must be empty before delivery; cuts (one big jump) are fine.
"""
import glob
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageChops, ImageStat

video = sys.argv[1]
base = sys.argv[2] if len(sys.argv) > 2 else os.path.join("out", "qc", os.path.basename(video).split(" ")[0])
os.makedirs(os.path.dirname(base) or ".", exist_ok=True)


def run(args):
    return subprocess.run(args, capture_output=True, text=True).stdout + subprocess.run(args, capture_output=True, text=True).stderr


print(run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_name,width,height,nb_frames:format=duration", "-of", "compact", video]).strip())
loud = [l.strip() for l in run(["ffmpeg", "-hide_banner", "-i", video, "-af", "ebur128=peak=true", "-f", "null", "-"]).splitlines() if l.strip().startswith(("I:", "Peak:"))]
print("loudness:", " | ".join(loud[-2:]))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf", "fps=1/1.8,scale=270:-1,tile=6x4", "-frames:v", "1", base + "_frames.jpg"])
print("frame sheet:", base + "_frames.jpg")

with tempfile.TemporaryDirectory() as d:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf", "scale=180:320", os.path.join(d, "f%05d.png")])
    ims = [Image.open(f).convert("L") for f in sorted(glob.glob(os.path.join(d, "f*.png")))]
dm = lambda a, b: ImageStat.Stat(ImageChops.difference(a, b)).mean[0]
diff = [dm(ims[i], ims[i + 1]) for i in range(len(ims) - 1)]
pops = [i for i in range(1, len(ims) - 1) if diff[i - 1] > 4 and diff[i] > 4 and dm(ims[i - 1], ims[i + 1]) < min(diff[i - 1], diff[i]) * 0.6]
whips, cur = [], []
for i, x in enumerate(diff):
    if x > 25:
        cur.append(i + 1)
    else:
        if len(cur) > 2:
            whips.append((cur[0], cur[-1]))
        cur = []
print("pops:", pops or "none")
print("whips:", whips or "none")
sys.exit(1 if pops or whips else 0)
