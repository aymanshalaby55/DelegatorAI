from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_name: str = "DelegatorAI"
    debug: bool = False

    # CORS
    frontend_url: str = "https://1wwmrxxr-3000.uks1.devtunnels.ms"

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_key: str = ""
    # Auth
    nextauth_secret: str = ""
    jwt_algorithm: str = "P-256"

    # Meeting BaaS
    meeting_baas_api_key: str = ""
    meeting_baas_base_url: str = "https://api.meetingbaas.com/"
    meeting_baas_webhook_url: str = ""
    meeting_baas_webhook_secret: str = (
        ""  # SVIX signing secret from Meeting BaaS dashboard
    )

    # Gemini (Google)
    gemini_api_key: str = ""

    # OpenAI
    openai_api_key: str = ""

    # Anthropic
    anthropic_api_key: str = ""

    # GitHub
    github_client_id: str = ""
    github_client_secret: str = ""
    github_oauth_redirect_uri: str = (
        "https://1wwmrxxr-3000.uks1.devtunnels.ms/auth/callback/github"
    )

    # Slack
    slack_client_id: str = ""
    slack_client_secret: str = ""
    slack_signing_secret: str = ""
    slack_oauth_redirect_uri: str = (
        "https://1wwmrxxr-3000.uks1.devtunnels.ms/auth/callback/slack"
    )

    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    # Default LLM
    default_llm_provider: str = "gemini"

    # Default meeting provider
    default_meeting_provider: str = "meeting_baas"

    # Resend
    resend_api_key: str = ""

    model_config = {
        "env_file": "../../../.env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
