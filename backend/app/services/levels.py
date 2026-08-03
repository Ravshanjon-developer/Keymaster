LEVEL_TITLES = [
    "Новичок",
    "Ученик",
    "Практикант",
    "Junior",
    "Junior+",
    "Middle",
    "Middle+",
    "Senior",
    "Senior+",
    "Keyboard Master",
    "Shortcut Legend",
]

LEVEL_XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500]


def level_from_xp(xp: int) -> tuple[int, str]:
    level = 1
    for i, threshold in enumerate(LEVEL_XP_THRESHOLDS):
        if xp >= threshold:
            level = i + 1
    level = min(level, len(LEVEL_TITLES))
    return level, LEVEL_TITLES[level - 1]


def xp_for_level(level: int) -> int:
    idx = max(0, min(level - 1, len(LEVEL_XP_THRESHOLDS) - 1))
    return LEVEL_XP_THRESHOLDS[idx]
