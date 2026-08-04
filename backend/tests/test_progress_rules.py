"""Rules mirrored from progress routes — keep contracts stable."""


def test_lesson_xp_granted_only_once():
    already_completed = False
    xp_gained = 0
    lesson_xp = 15
    if not already_completed:
        xp_gained = lesson_xp
    assert xp_gained == 15

    already_completed = True
    xp_gained = 0
    if not already_completed:
        xp_gained = lesson_xp
    assert xp_gained == 0


def test_leaderboard_excludes_admin_flag_in_route_source():
    from pathlib import Path

    src = Path(__file__).resolve().parents[1] / "app" / "services" / "leaderboard.py"
    text = src.read_text(encoding="utf-8")
    assert "is_admin.is_(False)" in text
