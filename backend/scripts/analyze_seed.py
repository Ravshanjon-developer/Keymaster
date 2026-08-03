import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from app.services.seed_data import COURSES

out = []
for c in COURSES:
    course = {
        "slug": c["slug"],
        "title": c["title"],
        "description": c["description"],
        "categories": [],
    }
    for cat in c["categories"]:
        catd = {"slug": cat["slug"], "title": cat["title"], "lessons": []}
        for i, lesson in enumerate(cat["lessons"]):
            catd["lessons"].append(
                {
                    "i": i,
                    "title": lesson["title"],
                    "action_prompt": lesson["action_prompt"],
                    "keys": lesson["keys"],
                    "usage_example": lesson["usage_example"],
                    "description": lesson["description"],
                }
            )
        course["categories"].append(catd)
    out.append(course)

dump = pathlib.Path(__file__).resolve().parents[2] / "frontend" / "src" / "shared" / "i18n" / "content_ru_dump.json"
dump.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

for c in out:
    n = sum(len(cat["lessons"]) for cat in c["categories"])
    print(f"{c['slug']}\t{n}\t{c['title']}")

bulk = 0
real = 0
for c in out:
    for cat in c["categories"]:
        for lesson in cat["lessons"]:
            title = lesson["title"]
            if (
                title.startswith("Ctrl+")
                or title.startswith("Chrome Ctrl")
                or (title.startswith("F") and title[1:].isdigit())
            ):
                bulk += 1
            else:
                real += 1
print("bulk", bulk, "real", real, "total", bulk + real)
