from functools import cached_property

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


_UNSAFE_SECRETS = {
    "",
    "dev-secret-key-change-in-production-min-32",
    "change-me-in-production",
    "your-secret-key-min-32-chars-long",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    database_url: str = "sqlite+aiosqlite:///./keymaster.db"
    secret_key: str = "dev-secret-key-change-in-production-min-32"
    access_token_expire_minutes: int = 60 * 24  # 24h default (was 7d)
    cors_origins: str = (
        "http://localhost:5173,http://localhost:5174,"
        "http://127.0.0.1:5173,http://127.0.0.1:5174"
    )
    trusted_hosts: str = "localhost,127.0.0.1,testserver"
    google_client_id: str | None = None
    google_client_secret: str | None = None

    # Bootstrap first admin from env — never hardcode passwords in code
    admin_email: str | None = None
    admin_username: str | None = None
    admin_password: str | None = None
    admin_display_name: str = "KeyMaster Admin"
    # If true and admin exists, re-hash password from ADMIN_PASSWORD on startup
    admin_sync_password: bool = False

    seed_on_startup: bool = True
    rate_limit_auth_per_minute: int = 20
    rate_limit_admin_per_minute: int = 60

    frontend_url: str = "http://localhost:5173"
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    smtp_use_tls: bool = True

    supabase_jwt_secret: str | None = None
    # Optional; used for JWKS URL if JWT uses ES256 signing keys
    supabase_url: str | None = None

    @field_validator("app_env")
    @classmethod
    def normalize_env(cls, value: str) -> str:
        return (value or "development").strip().lower()

    @cached_property
    def is_production(self) -> bool:
        return self.app_env in {"production", "prod"}

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def trusted_host_list(self) -> list[str]:
        hosts = [h.strip() for h in self.trusted_hosts.split(",") if h.strip()]
        return hosts or ["localhost", "127.0.0.1"]

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        if not self.is_production:
            return self
        if self.secret_key in _UNSAFE_SECRETS or len(self.secret_key) < 48:
            raise ValueError(
                "Production requires SECRET_KEY of at least 48 random characters. "
                "Generate one: python -c \"import secrets; print(secrets.token_urlsafe(64))\""
            )
        if "sqlite" in self.database_url.lower():
            raise ValueError("Production must use PostgreSQL (DATABASE_URL=postgresql+asyncpg://...)")
        if not self.admin_email or not self.admin_password or not self.admin_username:
            raise ValueError(
                "Production requires ADMIN_EMAIL, ADMIN_USERNAME and ADMIN_PASSWORD "
                "(strong password, min 14 chars with upper/lower/digit/symbol)."
            )
        if "*" in self.cors_origins:
            raise ValueError("CORS_ORIGINS must not contain '*' in production")
        return self


settings = Settings()
