"""Synthesize one paragraph with Kokoro-82M (Hugging Face: hexgrad/Kokoro-82M) via kokoro-onnx.

usage: python kokoro_say.py <voice> <out.wav>   (text on stdin)

Model files are cached in .cache/kokoro/ (kokoro-v1.0.onnx, voices-v1.0.bin) and downloaded on first use.
"""
import os
import sys
import urllib.request
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

BASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
cache = Path(__file__).resolve().parents[2] / ".cache" / "kokoro"
cache.mkdir(parents=True, exist_ok=True)
for name in ("kokoro-v1.0.onnx", "voices-v1.0.bin"):
    if not (cache / name).exists():
        urllib.request.urlretrieve(BASE + name, cache / name)

voice, out = sys.argv[1], sys.argv[2]
text = sys.stdin.buffer.read().decode("utf-8")
# No CPU memory arena: onnxruntime otherwise reserves memory in large doubling chunks, which
# fails on a machine that is low on memory even when the clip itself would fit.
import onnxruntime as ort

options = ort.SessionOptions()
options.enable_cpu_mem_arena = False
session = ort.InferenceSession(str(cache / "kokoro-v1.0.onnx"), sess_options=options, providers=["CPUExecutionProvider"])
kokoro = Kokoro.from_session(session, str(cache / "voices-v1.0.bin"))

def synth(chunk):
    return kokoro.create(chunk, voice=voice, speed=float(os.environ.get("KOKORO_SPEED", "1.0")), lang="en-us")


try:
    samples, rate = synth(text)
except Exception as first_error:  # noqa: BLE001
    # onnxruntime allocates one decoder buffer per batch, and on a machine that is low on
    # memory a whole paragraph can fail to allocate. Fall back to one batch per sentence,
    # joined with a short pause, which needs a fraction of the memory.
    import re

    import numpy as np

    sentences = [s for s in re.split(r"(?<=[.!?:;])\s+", text.strip()) if s]
    if len(sentences) < 2:
        raise first_error
    parts, rate = [], None
    for sentence in sentences:
        audio, rate = synth(sentence)
        parts.append(audio)
        parts.append(np.zeros(int(rate * 0.3), dtype=audio.dtype))
    samples = np.concatenate(parts[:-1])
sf.write(out, samples, rate)
