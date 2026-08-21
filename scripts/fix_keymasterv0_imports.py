from pathlib import Path

root = Path(__file__).resolve().parents[1] / "frontend/src/features/keymasterv0"
for path in root.rglob("*"):
    if path.suffix not in (".tsx", ".ts"):
        continue
    text = path.read_text(encoding="utf-8")
    new = text
    new = new.replace("'use client'\n\n", "").replace("'use client'\r\n\r\n", "")
    new = new.replace("@/lib/workspace/", "@/features/keymasterv0/lib/")
    new = new.replace("@/lib/utils", "@/shared/lib/utils")
    # internal workspace imports from copied files
    new = new.replace("from '@/features/keymasterv0/workspace/", "from '@/features/keymasterv0/workspace/")
    if new != text:
        path.write_text(new, encoding="utf-8")
print("done")
