"""Runs the ASSERT suite for agent-drafted weekends (L2-212).

    python evals/assert/run_evals.py                    # all behaviours, controls on ("after")
    python evals/assert/run_evals.py --controls off     # the "before" baseline (L2-209)
    python evals/assert/run_evals.py b1 b3              # some behaviours
    python evals/assert/run_evals.py --no-api           # the e2e API is already running with agents on
    python evals/assert/run_evals.py --rejudge b5       # score again only the rows whose judge failed

Without ``ANTHROPIC_FOUNDRY_API_KEY`` every behaviour is skipped with the L2-212
message and the command exits 0: the agents only exist on the real Foundry
deployment, so there is nothing honest to evaluate. With the key it

1. (re)starts the e2e API (``eng/Start-E2eApi.ps1``) with agent planning on,
   ``Auth=Key`` and the chosen controls setting;
2. runs ``assert-ai run --config behaviors/<behaviour>/eval_config.yaml`` per
   behaviour, with this folder on ``PYTHONPATH`` so ``saturdaze_target:chat``
   imports, recording every plan under ``artifacts/plans/<behaviour>/``;
3. restarts the API with an unreachable Foundry resource for B7 (tools fail);
4. runs ``check_boundaries.py`` and exits with its result.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
SKIP = "Skipped: ANTHROPIC_FOUNDRY_API_KEY is not set; ASSERT evaluations need the real Foundry deployment."

sys.path.insert(0, str(HERE))
from check_boundaries import BEHAVIOURS, PLANS  # noqa: E402


def load_dotenv() -> None:
    """`evals/assert/.env` (never committed) fills anything the shell did not set."""
    env = HERE / ".env"
    if not env.exists():
        return
    for line in env.read_text().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())


def start_api(controls: bool, broken: bool = False) -> None:
    env = os.environ | {
        "Saturdaze__AgentPlanning__Enabled": "true",
        "Saturdaze__AgentPlanning__Auth": "Key",
        "Saturdaze__AgentPlanning__FoundryResource":
            "saturdaze-eval-unreachable" if broken else os.environ["FOUNDRY_RESOURCE"],
        "Saturdaze__AgentPlanning__Controls__Enabled": "true" if controls else "false",
        "Saturdaze__Ingestion__Claude__Provider": "Foundry",
        "Saturdaze__Ingestion__Claude__FoundryResource":
            "saturdaze-eval-unreachable" if broken else os.environ["FOUNDRY_RESOURCE"],
    }
    pwsh = shutil.which("pwsh") or shutil.which("powershell")
    if not pwsh:
        sys.exit("PowerShell 7 (pwsh) is needed to start the e2e API; start it yourself and pass --no-api.")
    subprocess.run([pwsh, "-NoProfile", "-File", str(REPO / "eng" / "Start-E2eApi.ps1")], env=env, check=True)


def run_behaviour(key: str, controls: bool, rejudge: bool = False) -> int:
    name = BEHAVIOURS[key]
    config = HERE / "behaviors" / name / "eval_config.yaml"
    run_name = "after-controls" if controls else "before-controls"
    plans = PLANS / run_name / name
    results = HERE / "artifacts" / "results" / f"saturdaze-{name}" / run_name
    if rejudge:
        # ASSERT skips every test case already in scores.jsonl, so dropping the rows whose judge
        # failed (a verdict it could not validate) and running again scores only those, from the
        # cached inference: no new drafts, the recorded plans stay.
        scores = results / "scores.jsonl"
        if scores.exists():
            kept = [line for line in scores.read_text(encoding="utf-8").splitlines()
                    if line.strip() and json.loads(line).get("judge_status", "ok") == "ok"]
            scores.write_text("".join(f"{line}\n" for line in kept), encoding="utf-8")
    else:
        if plans.exists():
            shutil.rmtree(plans)
        # ASSERT resumes a run from its results folder (cached inference), which would leave the
        # recorded plans above empty; a behaviour run here always starts from scratch.
        if results.exists():
            shutil.rmtree(results)
    text = config.read_text(encoding="utf-8").replace("run: after-controls", f"run: {run_name}")
    # ASSERT resolves a relative artifacts_root against its own package, so pin it to this folder,
    # where check_boundaries.py reads artifacts/results/<suite>/<run>/metrics.json.
    text = f"artifacts_root: {(HERE / 'artifacts').as_posix()}\n" + text
    with tempfile.NamedTemporaryFile("w", suffix=".yaml", delete=False, dir=config.parent, encoding="utf-8") as tmp:
        tmp.write(text)
    env = os.environ | {
        "SATURDAZE_EVAL_BEHAVIOR": name,
        "SATURDAZE_EVAL_RECORD_DIR": str(PLANS / run_name),
        "PYTHONPATH": os.pathsep.join(filter(None, [str(HERE), os.environ.get("PYTHONPATH")])),
    }
    try:
        print(f"== {name} ({run_name})", flush=True)
        return subprocess.run(["assert-ai", "run", "--config", tmp.name], cwd=HERE, env=env).returncode
    finally:
        os.unlink(tmp.name)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("behaviours", nargs="*", help="b1 to b7; default: all")
    parser.add_argument("--controls", choices=("on", "off"), default="on",
                        help="off measures the 'before' baseline with the policy controls recording only")
    parser.add_argument("--no-api", action="store_true", help="use the API already running on SATURDAZE_API_URL")
    parser.add_argument("--rejudge", action="store_true",
                        help="score again only the test cases whose judge failed, from the recorded run (no drafts)")
    args = parser.parse_args()
    unknown = [b for b in args.behaviours if b not in BEHAVIOURS]
    if unknown:
        parser.error(f"unknown behaviour(s) {unknown}; choose from {sorted(BEHAVIOURS)}")
    keys = args.behaviours or sorted(BEHAVIOURS)

    load_dotenv()
    if not os.environ.get("ANTHROPIC_FOUNDRY_API_KEY"):
        for key in keys:
            print(f"{BEHAVIOURS[key]}: {SKIP}")
        return 0
    for needed in ("FOUNDRY_RESOURCE", "AZURE_AI_API_KEY", "AZURE_AI_API_BASE"):
        if not os.environ.get(needed):
            sys.exit(f"{needed} is not set; see evals/assert/.env.example.")
    if not shutil.which("assert-ai"):
        sys.exit("assert-ai is not installed: pip install -r evals/assert/requirements.txt")

    controls = args.controls == "on"
    run_name = "after-controls" if controls else "before-controls"
    if args.rejudge:
        for key in keys:
            run_behaviour(key, controls, rejudge=True)
        return subprocess.run([sys.executable, str(HERE / "check_boundaries.py"), "--run", run_name, *keys]).returncode
    working = [k for k in keys if k != "b7"]
    if working:
        if not args.no_api:
            start_api(controls)
        for key in working:
            run_behaviour(key, controls)
    if "b7" in keys:
        start_api(controls, broken=True)
        run_behaviour("b7", controls)
        if not args.no_api:
            start_api(controls)  # leave a working API behind

    return subprocess.run([sys.executable, str(HERE / "check_boundaries.py"), "--run", run_name, *keys]).returncode


if __name__ == "__main__":
    sys.exit(main())
