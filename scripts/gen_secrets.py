#!/usr/bin/env python3
"""Generate production secrets for KeyMaster. Do not commit the output."""

from __future__ import annotations

import secrets
import string


def strong_password(length: int = 24) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*_-+=?"
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(length))
        if (
            any(c.islower() for c in pwd)
            and any(c.isupper() for c in pwd)
            and any(c.isdigit() for c in pwd)
            and any(c in "!@#$%^&*_-+=?" for c in pwd)
        ):
            return pwd


def main() -> None:
    print("# Paste into .env / hosting secrets — never commit")
    print(f"SECRET_KEY={secrets.token_urlsafe(64)}")
    print(f"POSTGRES_PASSWORD={secrets.token_urlsafe(32)}")
    print(f"ADMIN_PASSWORD={strong_password(24)}")


if __name__ == "__main__":
    main()
