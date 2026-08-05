import json
import urllib.error
import urllib.request

API = "https://keymaster-production-2e1e.up.railway.app/api"

# 1) health
req = urllib.request.Request(f"{API.replace('/api', '')}/health")
with urllib.request.urlopen(req, timeout=20) as r:
    print("health", r.status, r.read().decode())

# 2) wrong password should be 401, not network fail
body = json.dumps({"email": "nobody@example.com", "password": "WrongPass12345!"}).encode()
req = urllib.request.Request(
    f"{API}/auth/login/json",
    data=body,
    headers={
        "Content-Type": "application/json",
        "Origin": "https://keymaster.pp.ua",
    },
    method="POST",
)
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        print("login unexpected ok", r.status, r.read().decode())
except urllib.error.HTTPError as e:
    print("login status", e.code)
    print("login body", e.read().decode())
    print("cors", e.headers.get("Access-Control-Allow-Origin"))
except Exception as e:
    print("login network error", type(e), e)

# 3) courses from browser origin
req = urllib.request.Request(
    f"{API}/courses",
    headers={"Origin": "https://keymaster.pp.ua"},
)
with urllib.request.urlopen(req, timeout=30) as r:
    print("courses", r.status, "cors", r.headers.get("Access-Control-Allow-Origin"), "len", len(r.read()))
