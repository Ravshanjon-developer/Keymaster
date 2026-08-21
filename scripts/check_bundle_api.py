import re
import pathlib
import tempfile

p = pathlib.Path(tempfile.gettempdir()) / "km-index.js"
d = p.read_text(encoding="utf-8", errors="ignore")
print("size", len(d))
print("has railway", "railway" in d)
print("has keymaster-production", "keymaster-production" in d)
urls = re.findall(r"https://[A-Za-z0-9._/-]+", d)
print("urls", urls[:40])
for needle in ("/api", "API_BASE", "VITE_API"):
    print(needle, d.count(needle))
# common vite pattern: literal string used as base
m = re.findall(r'["\']([^"\']*api[^"\']*)["\']', d, flags=re.I)
uniq = list(dict.fromkeys(m))
print("api-ish strings", uniq[:40])
