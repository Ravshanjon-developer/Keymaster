import asyncio
import hashlib
import logging
import secrets
import smtplib
from datetime import UTC, datetime, timedelta
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("keymaster.email")

VERIFY_HOURS = 48


def hash_verification_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def new_verification_token() -> tuple[str, str, datetime]:
    raw = secrets.token_urlsafe(32)
    return raw, hash_verification_token(raw), datetime.now(UTC) + timedelta(hours=VERIFY_HOURS)


def verification_link(raw_token: str) -> str:
    base = settings.frontend_url.rstrip("/")
    return f"{base}/verify-email?token={raw_token}"


def _build_message(to_email: str, link: str) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = "Подтвердите email — KeyMaster"
    msg["From"] = settings.smtp_from or settings.smtp_user or "noreply@keymaster.app"
    msg["To"] = to_email
    text = (
        "Здравствуйте!\n\n"
        "Вы зарегистрировались в KeyMaster. Подтвердите email, чтобы войти в аккаунт:\n\n"
        f"{link}\n\n"
        "Ссылка действует 48 часов. Если вы не регистрировались — проигнорируйте письмо.\n"
    )
    msg.set_content(text)
    msg.add_alternative(
        f"""<p>Здравствуйте!</p>
<p>Вы зарегистрировались в <strong>KeyMaster</strong>. Нажмите кнопку, чтобы подтвердить email:</p>
<p><a href="{link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Подтвердить email</a></p>
<p>Или скопируйте ссылку: <a href="{link}">{link}</a></p>
<p>Ссылка действует 48 часов.</p>""",
        subtype="html",
    )
    return msg


def _send_smtp_sync(msg: EmailMessage) -> None:
    host = settings.smtp_host
    if not host:
        raise RuntimeError("SMTP not configured")
    port = settings.smtp_port
    with smtplib.SMTP(host, port, timeout=30) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        user = settings.smtp_user
        password = settings.smtp_password
        if user and password:
            smtp.login(user, password)
        smtp.send_message(msg)


async def send_verification_email(to_email: str, raw_token: str) -> None:
    link = verification_link(raw_token)
    msg = _build_message(to_email, link)

    if not settings.smtp_host:
        logger.warning(
            "SMTP_HOST not set — verification link for %s: %s",
            to_email,
            link,
        )
        return

    try:
        await asyncio.to_thread(_send_smtp_sync, msg)
        logger.info("Verification email sent to %s", to_email)
    except Exception:
        logger.exception("Failed to send verification email to %s", to_email)
        raise
