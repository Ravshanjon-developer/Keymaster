import json
from pathlib import Path

transcript = Path(
    r"C:\Users\hp ryzen7 8 ядро\.cursor\projects\c-Users-hp-ryzen7-8-Desktop-SAYT-Hotkeys-helper\agent-transcripts\3ea88397-d0a9-40bd-baed-559650a11967\3ea88397-d0a9-40bd-baed-559650a11967.jsonl"
)
out = Path(__file__).resolve().parents[1] / "frontend/src/features/simulator/LegacyDesktopSimulator.tsx"

candidates: list[tuple[int, str, str]] = []

for line in transcript.read_text(encoding="utf-8").splitlines():
    try:
        o = json.loads(line)
    except json.JSONDecodeError:
        continue
    for p in o.get("message", {}).get("content", []):
        inp = p.get("input", {})
        path = inp.get("path", "")
        if not path.endswith("DesktopSimulatorPage.tsx"):
            continue
        c = inp.get("contents") or inp.get("new_string") or ""
        if "export function DesktopSimulatorPage" not in c and "export function LegacyDesktopSimulator" not in c:
            if "DesktopOsSimulatorView" in c or "desktopMode" in c:
                c = ""  # partial patch only
        if len(c) < 500:
            continue
        score = len(c)
        if "DesktopOsSimulatorView" in c:
            score += 50000
        if "desktopMode" in c:
            score += 10000
        if "useSearchParams" in c:
            score += 5000
        candidates.append((score, path, c))

if not candidates:
    raise SystemExit("no candidates")

candidates.sort(key=lambda x: x[0], reverse=True)
_, _, best = candidates[0]

best = best.replace("export function DesktopSimulatorPage", "export function LegacyDesktopSimulator")
best = best.replace(
    "import { PracticeKeyboardGate } from '@/features/mobile/PracticeKeyboardGate'\n", ""
)
best = best.replace("import { DesktopOsSimulatorView } from '@/features/simulator/DesktopOsSimulatorView'\n",
                    "import { DesktopOsSimulatorView } from '@/features/simulator/_legacy/DesktopOsSimulatorView'\n")
best = best.replace("from '@/features/simulator/simulatorTypes'\n",
                    "from '@/features/simulator/_legacy/simulatorTypes'\n")

# unwrap PracticeKeyboardGate — page wrapper owns it
best = best.replace("<PracticeKeyboardGate>", "<>")
best = best.replace("</PracticeKeyboardGate>", "</>")

out.write_text(best, encoding="utf-8")
print(f"wrote {len(best)} score={candidates[0][0]}")
