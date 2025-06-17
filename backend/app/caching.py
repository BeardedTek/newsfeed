import redis
import os
import json
import hashlib
import functools
from sqlalchemy.orm import Session # Import Session to check type
import datetime # Import datetime for checking serializability

# Get Redis URL from environment variables. Use the same one as Celery.
REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379/0')

# Initialize Redis client for caching
# Decode responses to get strings instead of bytes
# Set socket_connect_timeout for robustness
try:
    redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True, socket_connect_timeout=5)
    # Optional: Check connection
    redis_client.ping()
    print("Successfully connected to Redis for caching.")
except redis.exceptions.ConnectionError as e:
    print(f"Could not connect to Redis at {REDIS_URL} for caching: {e}")
    redis_client = None # Set client to None if connection fails

def get_cache(key: str):
    """Retrieves data from Redis cache."""
    if redis_client is None:
        # print("Redis client is not initialized. Cannot get cache.") # Avoid excessive logging
        return None
    try:
        data = redis_client.get(key)
        if data:
            # Assuming cached data is JSON string
            # print(f"Cache hit for key: {key}") # Optional: log cache hit
            return json.loads(data)
        # print(f"Cache miss for key: {key}") # Optional: log cache miss
        return None
    except Exception as e:
        print(f"Error getting cache for key {key}: {e}")
        return None

def set_cache(key: str, value: any, expire_seconds: int = 300):
    """Sets data in Redis cache with an expiration time."""
    if redis_client is None:
        # print("Redis client is not initialized. Cannot set cache.") # Avoid excessive logging
        return
    try:
        # Cache data as JSON string
        # Use default=str to serialize non-standard types like datetime if they slip through
        redis_client.setex(key, expire_seconds, json.dumps(value, default=str))
        # print(f"Cache set for key: {key} with expiration {expire_seconds}s") # Optional: log cache set
    except Exception as e:
        print(f"Error setting cache for key {key}: {e}")

def delete_cache(key: str):
    """Deletes data from Redis cache."""
    if redis_client is None:
        # print("Redis client is not initialized. Cannot delete cache.") # Avoid excessive logging
        return
    try:
        redis_client.delete(key)
        # print(f"Cache deleted for key: {key}") # Optional: log cache delete
    except Exception as e:
        print(f"Error deleting cache for key {key}: {e}")

# --- Cache Decorator ---

def cache_response(expire_seconds: int = 300):
    """
    Decorator to cache the response of an API endpoint or function.
    Caches based on function name and its *JSON-serializable* keyword arguments.
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Build a dictionary of serializable keyword arguments for the cache key
            # This is more robust than trying to exclude specific types
            serializable_kwargs = {}
            for k, v in kwargs.items():
                # Check if the value is of a type that is typically JSON serializable
                # This is not exhaustive but covers common cases for API parameters
                if isinstance(v, (int, float, str, bool, type(None))):
                     serializable_kwargs[k] = v
                # Handle lists, dictionaries, and tuples containing serializable types recursively if needed,
                # but for simple query/path parameters, the above check is usually sufficient.
                # For more complex parameter types, you might need custom serialization or a more sophisticated key generation.
                # As a pragmatic approach for typical API params, we'll include simple types and None.

            # Generate a cache key based on the function name and serializable kwargs
            # Ensure serializable_kwargs are sorted by keys for consistent hashing
            sorted_serializable_kwargs = sorted(serializable_kwargs.items())
            # Use json.dumps on the sorted list of key-value pairs
            kwargs_string = json.dumps(sorted_serializable_kwargs, sort_keys=True)

            # Include function name to avoid key collisions between different endpoints
            cache_key_base = f"{func.__name__}:{kwargs_string}"
            # Use a hash of the parameters string to keep the key length reasonable
            cache_key = f"cache:{hashlib.md5(cache_key_base.encode()).hexdigest()}"

            # Try to get data from cache
            cached_data = get_cache(cache_key)
            if cached_data is not None: # Check for None specifically
                return cached_data

            # If not in cache, call the original function with all original args and kwargs
            response_data = await func(*args, **kwargs)

            # Store data in cache before returning
            # Use default=str during json.dumps to handle potential non-standard types
            # within the response data itself if they aren't covered by Pydantic models.
            set_cache(cache_key, response_data, expire_seconds)

            return response_data
        return wrapper
    return decorator