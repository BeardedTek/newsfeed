from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    """Application settings."""
    # Environment
    environment: str = os.getenv("ENVIRONMENT", "development")
    
    # Database settings
    postgres_user: str = os.getenv("POSTGRES_USER", "postgres")
    postgres_password: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    postgres_db: str = os.getenv("POSTGRES_DB", "newsfeed")
    postgres_host: str = os.getenv("POSTGRES_HOST", "db")
    
    # Casdoor settings
    casdoor_endpoint: str = os.getenv("CASDOOR_ENDPOINT", "")
    casdoor_client_id: str = os.getenv("CASDOOR_CLIENT_ID", "")
    casdoor_client_secret: str = os.getenv("CASDOOR_CLIENT_SECRET", "")
    casdoor_cert: str = os.getenv("CASDOOR_CERT_PUBLIC_KEY", "")
    casdoor_org_name: str = os.getenv("CASDOOR_ORG", "")
    casdoor_app_name: str = os.getenv("CASDOOR_APP_NAME", "")
    
    # Frontend settings
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Cloudflare Turnstile settings
    cloudflare_turnstile_secret_key: str = os.getenv("CLOUDFLARE_TURNSTILE_SECRET_KEY", "")
    cloudflare_turnstile_site_key: str = os.getenv("CLOUDFLARE_TURNSTILE_SITE_KEY", "")
    cloudflare_turnstile_enable: bool = os.getenv("CLOUDFLARE_TURNSTILE_ENABLE", "true").lower() in ("true", "1", "t", "yes")
    
    # Application settings
    debug: bool = os.getenv("BACKEND_DEBUG", "false").lower() in ("true", "1", "t", "yes")
    
    # API settings
    api_prefix: str = "/api"
    
    # Cache settings
    article_list_cache_expire: int = 60
    single_article_cache_expire: int = 300
    
    # FreshRSS settings
    freshrss_api_host: str = os.getenv("FRESHRSS_API_HOST", "")
    freshrss_api_username: str = os.getenv("FRESHRSS_API_USERNAME", "")
    freshrss_api_password: str = os.getenv("FRESHRSS_API_PASSWORD", "")
    
    # DiceBear settings
    dicebear_url: str = os.getenv("DICEBEAR_URL", "https://api.dicebear.com/9.x")
    dicebear_style: str = os.getenv("DICEBEAR_STYLE", "pixel-art")
    dicebear_radius: int = int(os.getenv("DICEBEAR_RADIUS", "50"))
    dicebear_size: int = int(os.getenv("DICEBEAR_SIZE", "96"))
    dicebear_background_color: str = os.getenv("DICEBEAR_BACKGROUND_COLOR", "")  # hex color without #
    dicebear_background_type: str = os.getenv("DICEBEAR_BACKGROUND_TYPE", "")  # solid or gradientLinear
    dicebear_flip: bool = os.getenv("DICEBEAR_FLIP", "false").lower() in ("true", "1", "t", "yes")
    dicebear_random: bool = os.getenv("DICEBEAR_RANDOM", "true").lower() in ("true", "1", "t", "yes")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    """Return cached settings."""
    return Settings() 