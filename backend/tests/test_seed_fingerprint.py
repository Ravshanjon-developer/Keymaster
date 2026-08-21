from copy import deepcopy

from app.services.seed import fingerprint_from_seed
from app.services.seed_data import COURSES


def _computer_basics() -> dict:
    return next(c for c in COURSES if c["slug"] == "computer-basics")


def test_fingerprint_stable_for_same_seed():
    course = _computer_basics()
    assert fingerprint_from_seed(course) == fingerprint_from_seed(course)


def test_fingerprint_changes_when_lesson_keys_change():
    original = fingerprint_from_seed(_computer_basics())
    mutated = deepcopy(_computer_basics())
    mutated["categories"][1]["lessons"][0]["keys"] = ["desktop:99"]
    assert fingerprint_from_seed(mutated) != original


def test_computer_basics_practice_lessons_map_to_desktop_tasks():
    course = _computer_basics()
    mapped: list[int] = []
    for cat in course["categories"]:
        for lesson in cat["lessons"]:
            keys = lesson["keys"]
            if keys and keys[0].startswith("desktop:"):
                mapped.append(int(keys[0].split(":")[1]))
    assert mapped == list(range(1, 13))
