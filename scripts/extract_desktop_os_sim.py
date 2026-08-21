import json
from pathlib import Path

transcript = Path(
    r"C:\Users\hp ryzen7 8 ядро\.cursor\projects\c-Users-hp-ryzen7-8-Desktop-SAYT-Hotkeys-helper\agent-transcripts\3ea88397-d0a9-40bd-baed-559650a11967\3ea88397-d0a9-40bd-baed-559650a11967.jsonl"
)

best = ""
for line in transcript.read_text(encoding="utf-8").splitlines():
    if "DesktopOsSimulatorView" not in line:
        continue
    o = json.loads(line)
    for p in o.get("message", {}).get("content", []):
        c = (p.get("input") or {}).get("contents") or (p.get("input") or {}).get("new_string") or ""
        if "DesktopOsSimulatorView" in c and "export function DesktopSimulatorPage" in c and len(c) > len(best):
            best = c

out = Path(__file__).resolve().parents[1] / "frontend/src/features/simulator/LegacyDesktopOsSimulator.tsx"
if best:
    best = best.replace("export function DesktopSimulatorPage", "export function LegacyDesktopOsSimulator")
    best = best.replace(
        "import { PracticeKeyboardGate } from '@/features/mobile/PracticeKeyboardGate'\n", ""
    )
    best = best.replace(
        "import { DesktopOsSimulatorView } from '@/features/simulator/DesktopOsSimulatorView'\n",
        "import { DesktopOsSimulatorView } from '@/features/simulator/_legacy/DesktopOsSimulatorView'\n",
    )
    best = best.replace(
        "from '@/features/simulator/simulatorTypes'\n",
        "from '@/features/simulator/_legacy/simulatorTypes'\n",
    )
    best = best.replace("<PracticeKeyboardGate>", "<>")
    best = best.replace("</PracticeKeyboardGate>", "</>")
    out.write_text(best, encoding="utf-8")
    print("wrote desktop os", len(best))
else:
    print("no desktop os page found")
