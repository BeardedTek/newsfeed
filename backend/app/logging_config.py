import os
import logging
import sys

def configure_logging():
    """Configure logging for the application."""
    debug_mode = os.getenv("BACKEND_DEBUG", "false").lower() in ("true", "1", "t", "yes")
    
    log_level = logging.DEBUG if debug_mode else logging.INFO
    
    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[logging.StreamHandler(sys.stdout)]
    )
    
    # Set level for specific loggers
    logging.getLogger("app.api").setLevel(log_level)
    
    # Log configuration info
    logging.getLogger("app").info(f"Logging configured with level: {'DEBUG' if debug_mode else 'INFO'}") 