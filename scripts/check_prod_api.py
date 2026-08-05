import re
import urllib.request
import tempfile
from pathlib import Path

BASE = "https://keymaster.pp.ua"
html = urllib.request.urlopen(BASE, timeout=20).read().decode("utf-8", "ignore")
assets = re.findall(r"/assets/[A-Za-z0-9._-]+\.js", html)
print("html assets", assets)

# Also try common lazy chunks mentioned in html modulepreload
tmpdir = Path(tempfile.gettempdir())
found_railway = False
found_relative_api = False
for asset in assets:
    url = BASE + asset
    data = urllib.request.urlopen(url, timeout=30).read().decode("utf-8", "ignore")
    (tmpdir / asset.replace("/assets/", "km-")).write_text(data, encoding="utf-8")
    print(asset, "size", len(data), "railway", "railway" in data, "/api count", data.count("/api"))
    if "railway" in data or "keymaster-production" in data:
        found_railway = True
        urls = re.findall(r"https://[A-Za-z0-9._/-]+", data)
        print("  urls", [u for u in urls if "railway" in u or "keymaster" in u])
    if "'/api" in data or '"/api' in data or "`/api" in data:
        found_relative_api = True

# Fetch a few more hashed chunks if referenced
for asset in assets:
    data = (tmpdir / asset.replace("/assets/", "km-")).read_text(encoding="utf-8")
    for ref in re.findall(r"assets/([A-Za-z0-9._-]+\.js)", data):
        path = f"/assets/{ref}"
        if path in assets:
            continue
        try:
            url = BASE + path
            chunk = urllib.request.urlopen(url, timeout=30).read().decode("utf-8", "ignore")
        except Exception as e:
            print("skip", path, e)
            continue
        print(path, "size", len(chunk), "railway", "railway" in chunk, "/api", chunk.count("/api"))
        if "railway" in chunk or "keymaster-production" in chunk:
            found_railway = True
            print("  FOUND", re.findall(r"https://[A-Za-z0-9._/-]*railway[A-Za-z0-9._/-]*", chunk)[:5])
        if "/api" in chunk and ("login" in chunk or "auth" in chunk):
            # show nearby snippet
            i = chunk.find("/api")
            print("  snippet", chunk[max(0, i - 40) : i + 80])

print("RESULT found_railway=", found_railway, "found_relative_api=", found_relative_api)
