import re

from fastapi import HTTPException, status

# Shared policy for registration + admin bootstrap
MIN_PASSWORD_LENGTH = 6
ADMIN_MIN_PASSWORD_LENGTH = 14

_COMMON = {
    "admin12345",
    "admin123456",
    "password",
    "password123",
    "qwerty123",
    "12345678",
    "123456",
    "keymaster",
    "keymaster123",
    "adminadmin",
}


def password_issues(password: str, *, admin: bool = False) -> list[str]:
    min_len = ADMIN_MIN_PASSWORD_LENGTH if admin else MIN_PASSWORD_LENGTH
    issues: list[str] = []
    if len(password) < min_len:
        issues.append(f"минимум {min_len} символов")
    if admin:
        if not re.search(r"[a-z]", password):
            issues.append("строчная буква")
        if not re.search(r"[A-Z]", password):
            issues.append("заглавная буква")
        if not re.search(r"\d", password):
            issues.append("цифра")
        if not re.search(r"[^\w\s]", password):
            issues.append("спецсимвол (!@#$%…)")
    if password.lower() in _COMMON or password.lower().startswith("admin123"):
        issues.append("слишком простой / запрещённый пароль")
    return issues


def validate_password_strength(password: str, *, admin: bool = False) -> None:
    issues = password_issues(password, admin=admin)
    if issues:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Слабый пароль: нужно " + ", ".join(issues),
        )


def assert_password_strength(password: str, *, admin: bool = False) -> None:
    """Raise ValueError for startup/bootstrap (not HTTP)."""
    issues = password_issues(password, admin=admin)
    if issues:
        raise ValueError("Слабый пароль: нужно " + ", ".join(issues))
