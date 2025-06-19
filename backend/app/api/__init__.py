"""
API package for FastAPI routes.
"""

import os
def debug_log(msg):
    if os.environ.get('BACKEND_DEBUG', '').lower() == 'true':
        print(f'[DEBUG] {msg}')

# Import all API modules to make them available
from app.api import articles
from app.api import categories
from app.api import related
from app.api import thumbnails
from app.api import sources
from app.api import admin
from app.api import auth
from app.api import user

__all__ = [
    'articles',
    'categories',
    'related',
    'thumbnails',
    'sources',
    'admin',
    'auth',
    'user',
]