from celery import Celery
import os
import httpx
import asyncio
from PIL import Image
import io
import redis
from typing import List, Dict, Any
import time
import re
import json
from celery.schedules import crontab
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from sqlalchemy.exc import IntegrityError
from app.freshrss_api_ext import FreshRSSAPIExt
from loguru import logger
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import trafilatura  # For better article extraction
import pytz
from io import BytesIO

from app.database import SessionLocal
from app.models.database import Article, Category

# Initialize Celery with optimized settings
celery_app = Celery('newsfeed', 
    broker=os.getenv('REDIS_URL', 'redis://redis:6379/0'),
    broker_connection_retry_on_startup=True,
    worker_prefetch_multiplier=int(os.environ.get('WORKER_PREFETCH_MULTIPLIER', 1)),  # Process one task at a time
    task_acks_late=True,  # Only acknowledge task after completion
    task_reject_on_worker_lost=True,  # Requeue task if worker dies
    task_time_limit=int(os.environ.get('WORKER_TASK_TIME_LIMIT', 300)),  # 5 minute timeout
    task_soft_time_limit=int(os.environ.get('WORKER_SOFT_TIME_LIMIT', 240)),  # 4 minute soft timeout
    worker_max_tasks_per_child=int(os.environ.get('WORKER_MAX_TASKS_PER_CHILD', 100)),  # Restart worker after 100 tasks
    worker_max_memory_per_child=int(os.environ.get('WORKER_MAX_MEMORY_PER_CHILD', 200000))  # Restart worker after 200MB memory usage
)

# Initialize Redis (only for Celery broker)
redis_client = redis.Redis.from_url(os.getenv('REDIS_URL', 'redis://redis:6379/0'))

# Constants
THUMB_SIZE = (96, 96)
CATEGORIES = [
    'Politics', 'US', 'World', 'Sports', 'Technology', 
    'Entertainment', 'Science', 'Health', 'Business'
]

# Fetch limit, concurrency, and days from environment
FETCH_LIMIT = int(os.environ.get('WORKER_FRESHRSS_FETCH_LIMIT', 100))
CONCURRENT_FETCH_TASKS = int(os.environ.get('WORKER_CONCURRENT_FRESHRSS_FETCH_TASKS', 1))
FETCH_DAYS = int(os.environ.get('WORKER_FRESHRSS_FETCH_DAYS', 3))
PURGE_NUM_DAYS_TO_KEEP = int(os.environ.get('WORKER_FRESHRSS_PURGE_NUM_DAYS_TO_KEEP', 7))
fetch_semaphore = asyncio.Semaphore(CONCURRENT_FETCH_TASKS)

# Task intervals in minutes
PROCESS_ARTICLES_INTERVAL = int(os.environ.get('WORKER_PROCESS_ARTICLES_INTERVAL', 15))
PURGE_OLD_ARTICLES_INTERVAL = int(os.environ.get('WORKER_PURGE_OLD_ARTICLES_INTERVAL', 1440))  # Default: 24 hours
ENRICH_ARTICLES_INTERVAL = int(os.environ.get('WORKER_ENRICH_ARTICLES_INTERVAL', 60))  # Default: 1 hour

CATEGORY_KEYWORDS = {
    'Politics': ['election', 'government', 'senate', 'congress', 'president', 'politics', 'law', 'policy', 'minister', 'parliament'],
    'US': ['united states', 'america', 'us ', 'usa', 'american', 'washington', 'new york', 'california'],
    'World': ['world', 'global', 'international', 'foreign', 'abroad', 'overseas'],
    'Sports': ['sport', 'game', 'match', 'tournament', 'league', 'nba', 'nfl', 'mlb', 'soccer', 'football', 'basketball', 'olympics'],
    'Technology': ['tech', 'technology', 'software', 'hardware', 'computer', 'ai', 'artificial intelligence', 'internet', 'app', 'gadget', 'device'],
    'Entertainment': ['movie', 'film', 'music', 'entertainment', 'tv', 'show', 'celebrity', 'concert', 'festival'],
    'Science': ['science', 'research', 'study', 'scientist', 'space', 'nasa', 'physics', 'chemistry', 'biology'],
    'Health': ['health', 'medicine', 'medical', 'doctor', 'hospital', 'disease', 'virus', 'covid', 'wellness'],
    'Business': ['business', 'market', 'stock', 'finance', 'economy', 'trade', 'company', 'corporate', 'industry'],
}

# Get timezone from environment variable, default to UTC
TIMEZONE = pytz.timezone(os.environ.get('TIMEZONE', 'UTC'))

# Add at the top, after imports
THUMBNAIL_DIR = os.environ.get('THUMBNAIL_DIR', '/thumbnails')

def debug_log(msg):
    if os.environ.get('BACKEND_DEBUG', '').lower() == 'true':
        print(f'[DEBUG] {msg}')

def get_freshrss_client() -> FreshRSSAPIExt:
    """Create and return a FreshRSS API client instance using environment variables."""
    try:
        client = FreshRSSAPIExt(verbose=False)
        return client
    except Exception as e:
        raise ValueError("Failed to initialize FreshRSS client")

def get_or_create_category(db: Session, name: str) -> Category:
    category = db.query(Category).filter(Category.name == name).first()
    if category:
        return category
    category = Category(name=name)
    db.add(category)
    try:
        db.commit()
        db.refresh(category)
    except IntegrityError:
        db.rollback()
        category = db.query(Category).filter(Category.name == name).first()
    return category

def get_greader_auth_token(api_url, username, password):
    login_url = f"{api_url}/accounts/ClientLogin"
    params = {"Email": username, "Passwd": password}
    resp = requests.get(login_url, params=params)
    if resp.status_code != 200:
        debug_log(f'GReader API login error: {resp.status_code} {resp.text}')
        raise Exception("Failed to get GReader Auth token")
    for line in resp.text.splitlines():
        if line.startswith("Auth="):
            token = line.split("=", 1)[1]
            debug_log(f'GReader Auth token fetched: {token[:8]}...')
            return token
    debug_log(f'GReader API login response did not contain Auth token: {resp.text}')
    raise Exception("Auth token not found in response")

def extract_url(item):
    if 'alternate' in item and item['alternate']:
        return item['alternate'][0].get('href', '')
    if 'canonical' in item and item['canonical']:
        return item['canonical'][0].get('href', '')
    return ''

def extract_thumbnail(item):
    if 'enclosure' in item and item['enclosure']:
        for enc in item['enclosure']:
            if enc.get('type', '').startswith('image/'):
                return enc.get('href', '')
    return ''

def get_current_time():
    """Get current time in configured timezone."""
    return datetime.now(TIMEZONE)

def convert_timestamp_to_timezone(timestamp):
    """Convert a Unix timestamp to datetime in configured timezone."""
    return datetime.fromtimestamp(timestamp, TIMEZONE)

def fetch_articles_from_greader_api(batch_size=None, days=None):
    """
    Fetch articles from the FreshRSS GReader API endpoint using GoogleLogin auth.
    Supports pagination to fetch all articles within the specified time period.
    """
    api_url = os.environ.get('FRESHRSS_GREADER_API_URL')
    api_user = os.environ.get('FRESHRSS_GREADER_API_USER')
    api_password = os.environ.get('FRESHRSS_GREADER_API_PASSWORD')
    if not api_url or not api_user or not api_password:
        debug_log('GReader API credentials or URL not set')
        return []
    try:
        auth_token = get_greader_auth_token(api_url, api_user, api_password)
    except Exception as e:
        debug_log(f'Failed to get GReader Auth token: {e}')
        return []

    # Calculate time window
    now = int(time.time())
    since = now - (days or FETCH_DAYS) * 86400
    
    all_articles = []
    continuation_token = None
    batch_count = 0
    
    while True:
        batch_count += 1
        debug_log(f'Fetching batch {batch_count} of articles')
        
        params = {
            'output': 'json',
            'n': batch_size or FETCH_LIMIT,
            'ot': since
        }
        
        # Add continuation token if we have one
        if continuation_token:
            params['c'] = continuation_token
            
        url = f'{api_url}/reader/api/0/stream/contents/reading-list'
        headers = {'Authorization': f'GoogleLogin auth={auth_token}'}
        
        debug_log(f'Fetching from GReader API: {url} with params {params}')
        resp = requests.get(url, params=params, headers=headers)
        
        if resp.status_code != 200:
            debug_log(f'GReader API error: {resp.status_code} {resp.text}')
            break
            
        try:
            data = resp.json()
        except Exception as e:
            debug_log(f'GReader API response (truncated): {resp.text[:200]}')
            debug_log(f'GReader API JSON decode error: {e}')
            break
            
        items = data.get('items', [])
        debug_log(f'Fetched {len(items)} items from GReader API in batch {batch_count}')
        
        if not items:
            debug_log('No more items to fetch')
            break
            
        for item in items:
            url = extract_url(item)
            if not url:
                debug_log(f'Skipping article with no URL. id={item.get("id")}')
                continue
                
            article = {
                'id': item.get('id'),
                'title': item.get('title'),
                'link': url,
                'description': item.get('summary', {}).get('content', ''),
                'content': item.get('summary', {}).get('content', ''),
                'summary': item.get('summary', {}).get('content', ''),
                'thumbnail_url': extract_thumbnail(item),
                'source_name': item.get('origin', {}).get('title', ''),
                'source_url': item.get('origin', {}).get('htmlUrl', ''),
                'published_at': convert_timestamp_to_timezone(item.get('published', 0)),
                'processed_at': get_current_time(),
                'is_processed': False
            }
            all_articles.append(article)
            
        # Get continuation token for next batch
        continuation_token = data.get('continuation')
        if not continuation_token:
            debug_log('No continuation token, finished fetching all articles')
            break
            
        # Add a small delay between batches to be polite
        time.sleep(1)
        
    debug_log(f'Finished fetching all articles. Total articles fetched: {len(all_articles)}')
    return all_articles

# Replace fetch_articles to use GReader API
async def fetch_articles(batch_size=None) -> list:
    return fetch_articles_from_greader_api(batch_size=batch_size, days=FETCH_DAYS)

def keyword_based_categorization(text: str) -> List[str]:
    """Fallback categorization using keyword matching."""
    lower_text = text.lower()
    categories = []
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in lower_text for keyword in keywords):
            categories.append(category)
    return categories

async def categorize_article(text: str) -> List[str]:
    # Try Ollama first
    prompt = (
        f"Given the following news article, assign up to 3 categories from this list that are clearly and unambiguously relevant: "
        f"[{', '.join(CATEGORIES)}]. Return only a JSON array of category names. "
        f"Do not include any category unless it is obviously relevant. If none are clearly relevant, return an empty array.\n\n"
        f"Article:\n{text}\n\nCategories:"
    )
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{os.getenv('OLLAMA_URL')}/api/generate",
                json={
                    "model": os.getenv('OLLAMA_MODEL', 'llama2'),
                    "prompt": prompt,
                    "stream": False
                }
            )
            if res.status_code != 200:
                return keyword_based_categorization(text)
            
            data = res.json()
            
            if 'response' not in data:
                return keyword_based_categorization(text)
            
            match = re.search(r"\[.*\]", data['response'])
            if not match:
                return keyword_based_categorization(text)
            
            try:
                categories = json.loads(match.group(0))
                # Filter out any categories that aren't in our predefined list and limit to 3
                valid_categories = [cat for cat in categories if cat in CATEGORIES][:3]
                return valid_categories
            except json.JSONDecodeError as e:
                return keyword_based_categorization(text)
    except Exception as e:
        return keyword_based_categorization(text)

def find_related_articles(db: Session, article: Article, all_articles: List[Article]) -> List[Article]:
    SIMILARITY_THRESHOLD = 0.3
    MAX_RELATED = 3
    def jaccard_similarity(a: str, b: str) -> float:
        set_a = set(a.lower().split())
        set_b = set(b.lower().split())
        intersection = len(set_a.intersection(set_b))
        union = len(set_a.union(set_b))
        return intersection / union if union > 0 else 0
    related = []
    for other in all_articles:
        if other.id != article.id:
            similarity = jaccard_similarity(article.title, other.title)
            if similarity >= SIMILARITY_THRESHOLD:
                related.append(other)
                if len(related) >= MAX_RELATED:
                    break
    return related

def save_thumbnail(image_url, article_id):
    debug_log(f'Running save_thumbnail for article_id={article_id}, image_url={image_url}')
    try:
        response = httpx.get(image_url, timeout=10)
        if response.status_code == 200:
            img = Image.open(BytesIO(response.content))
            img = img.convert('RGB')  # Ensure compatibility with webp
            img.thumbnail(THUMB_SIZE)
            os.makedirs(THUMBNAIL_DIR, exist_ok=True)
            thumbnail_path = os.path.join(THUMBNAIL_DIR, f'{article_id}.webp')
            img.save(thumbnail_path, 'WEBP')
            debug_log(f'save_thumbnail succeeded for article_id={article_id}, saved to {thumbnail_path}')
            return f'/thumbnails/{article_id}.webp'
        else:
            debug_log(f'save_thumbnail failed for article_id={article_id}, HTTP status {response.status_code}')
    except Exception as e:
        debug_log(f'Failed to create thumbnail for {article_id}: {e}')
    return None

def is_probably_icon(url):
    """Return True if the image URL looks like an icon/logo/social icon."""
    icon_keywords = ['icon', 'favicon', 'logo', 'twitter', 'facebook', 'linkedin', 'sprite', 'apple-touch']
    url_lower = url.lower()
    return any(keyword in url_lower for keyword in icon_keywords)

def is_small_image(url, min_width=100, min_height=100):
    """Return True if the image is smaller than the minimum dimensions."""
    try:
        with httpx.stream('GET', url, timeout=5.0) as response:
            if response.status_code == 200:
                img = Image.open(BytesIO(response.read()))
                width, height = img.size
                return width < min_width or height < min_height
    except Exception:
        pass
    return False

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Use environment variable for process_articles interval
    if PROCESS_ARTICLES_INTERVAL % 60 == 0:
        # If interval is in hours, schedule at the top of each hour
        hours = PROCESS_ARTICLES_INTERVAL // 60
        sender.add_periodic_task(
            crontab(minute=0, hour=f'*/{hours}'),
            process_articles.s(),
            name=f'process_articles_every_{hours}_hours'
        )
    else:
        # Otherwise schedule by minutes
        sender.add_periodic_task(
            crontab(minute=f'*/{PROCESS_ARTICLES_INTERVAL}'),
        process_articles.s(),
            name=f'process_articles_every_{PROCESS_ARTICLES_INTERVAL}_minutes'
    )
    
    # Use environment variable for purge_old_articles interval
    if PURGE_OLD_ARTICLES_INTERVAL % 1440 == 0:
        # If interval is in days, schedule at midnight
        days = PURGE_OLD_ARTICLES_INTERVAL // 1440
        sender.add_periodic_task(
            crontab(hour=0, minute=0, day_of_month=f'*/{days}'),
            purge_old_articles.s(),
            name=f'purge_old_articles_every_{days}_days'
        )
    elif PURGE_OLD_ARTICLES_INTERVAL % 60 == 0:
        # If interval is in hours, schedule at the top of each hour
        hours = PURGE_OLD_ARTICLES_INTERVAL // 60
        sender.add_periodic_task(
            crontab(minute=0, hour=f'*/{hours}'),
            purge_old_articles.s(),
            name=f'purge_old_articles_every_{hours}_hours'
        )
    else:
        # Otherwise schedule by minutes
        sender.add_periodic_task(
            crontab(minute=f'*/{PURGE_OLD_ARTICLES_INTERVAL}'),
        purge_old_articles.s(),
            name=f'purge_old_articles_every_{PURGE_OLD_ARTICLES_INTERVAL}_minutes'
    )
    
    # Use environment variable for enrich_articles interval
    if ENRICH_ARTICLES_INTERVAL % 60 == 0:
        # If interval is in hours, schedule at the top of each hour
        hours = ENRICH_ARTICLES_INTERVAL // 60
        sender.add_periodic_task(
            crontab(minute=0, hour=f'*/{hours}'),
            enrich_articles.s(),
            name=f'enrich_articles_every_{hours}_hours'
        )
    else:
        # Otherwise schedule by minutes
        sender.add_periodic_task(
            crontab(minute=f'*/{ENRICH_ARTICLES_INTERVAL}'),
        enrich_articles.s(),
            name=f'enrich_articles_every_{ENRICH_ARTICLES_INTERVAL}_minutes'
    )
    
    # Also trigger the initial tasks
    process_articles.delay()
    enrich_articles.delay()

@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,  # 1 minute between retries
    rate_limit='1/m',  # Maximum 1 task per minute
    time_limit=int(os.environ.get('WORKER_TASK_TIME_LIMIT', 300)),
    soft_time_limit=int(os.environ.get('WORKER_SOFT_TIME_LIMIT', 240))
)
def process_articles(self):
    debug_log('Starting process_articles task')
    db = SessionLocal()
    try:
        loop = asyncio.get_event_loop()
        fresh_articles = loop.run_until_complete(fetch_articles())
        debug_log(f'Fetched {len(fresh_articles)} fresh articles')
        
        # Get all existing article URLs in a single query
        existing_articles = {
            article.link: article 
            for article in db.query(Article).filter(
                Article.link.in_([a['link'] for a in fresh_articles])
            ).all()
        }
        
        # Filter out already processed articles
        new_articles = [
            article for article in fresh_articles 
            if article['link'] not in existing_articles or 
               not existing_articles[article['link']].is_processed
        ]
        
        debug_log(f'Found {len(new_articles)} new articles to process')
        
        BATCH_SIZE = 10
        for i in range(0, len(new_articles), BATCH_SIZE):
            batch = new_articles[i:i + BATCH_SIZE]
            debug_log(f'Processing batch {i//BATCH_SIZE+1}: {len(batch)} articles')
            
            for fresh_article in batch:
                try:
                    article_link = fresh_article.get('link', '')
                    if not article_link:
                        debug_log('Skipping article with no URL')
                        continue
                        
                    existing_article = existing_articles.get(article_link)
                    
                    article_data = {
                        'title': fresh_article.get('title', ''),
                        'link': article_link,
                        'description': fresh_article.get('description', ''),
                        'content': fresh_article.get('content', ''),
                        'source_name': fresh_article.get('source_name', ''),
                        'source_url': fresh_article.get('source_url', ''),
                        'published_at': fresh_article.get('published_at'),
                        'processed_at': get_current_time(),
                        'is_processed': False,
                        'image_url': fresh_article.get('thumbnail_url', '')
                    }
                    
                    if existing_article:
                        debug_log(f'Updating existing article: {article_link}')
                        for key, value in article_data.items():
                            setattr(existing_article, key, value)
                        article = existing_article
                    else:
                        debug_log(f'Creating new article: {article_link}')
                        article = Article(**article_data)
                        db.add(article)
                        db.commit()
                        db.refresh(article)
                        
                    if not article.categories:
                        text = f"{article.title} {article.description}"
                        debug_log(f'Categorizing article: {article_link}')
                        categories = loop.run_until_complete(categorize_article(text))
                        debug_log(f'Categories for {article_link}: {categories}')
                        for category_name in categories:
                            category = get_or_create_category(db, category_name)
                            article.categories.append(category)
                            
                    if not article.related_articles:
                        debug_log(f'Finding related articles for: {article_link}')
                        all_articles = db.query(Article).all()
                        related = find_related_articles(db, article, all_articles)
                        debug_log(f'Found {len(related)} related articles')
                        article.related_articles.extend(related)
                        
                    if not article.thumbnail_url:
                        enclosures = fresh_article.get('enclosures', [])
                        image_url = enclosures[0]['url'] if enclosures and 'url' in enclosures[0] else ''
                        if image_url:
                            debug_log(f'Generating thumbnail for: {article_link}')
                            thumbnail_url = save_thumbnail(image_url, article.id)
                            if thumbnail_url:
                                article.thumbnail_url = thumbnail_url
                                article.image_url = image_url
                                debug_log(f'Thumbnail set for: {article_link}')
                                
                    article.is_processed = True
                    db.commit()
                    
                except Exception as e:
                    debug_log(f'Exception processing article: {e}')
                    db.rollback()
                    continue
                    
            time.sleep(1)
            
    except Exception as e:
        debug_log(f'Exception in process_articles: {e}')
        db.rollback()
        self.retry(exc=e)
    finally:
        db.close()
        debug_log('process_articles task finished')

@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,  # 1 minute between retries
    rate_limit='1/m',  # Maximum 1 task per minute
    time_limit=int(os.environ.get('WORKER_TASK_TIME_LIMIT', 300)),
    soft_time_limit=int(os.environ.get('WORKER_SOFT_TIME_LIMIT', 240))
)
def purge_old_articles(self):
    debug_log('Starting purge_old_articles task')
    db = SessionLocal()
    try:
        days_to_keep = PURGE_NUM_DAYS_TO_KEEP
        cutoff = get_current_time() - timedelta(days=days_to_keep)
        old_articles = db.query(Article).filter(Article.published_at < cutoff).all()
        count = len(old_articles)
        debug_log(f'Purging {count} old articles older than {days_to_keep} days')
        for article in old_articles:
            db.delete(article)
            # Remove thumbnail file if it exists
            thumbnail_path = os.path.join(THUMBNAIL_DIR, f'{article.id}.webp')
            try:
                if os.path.exists(thumbnail_path):
                    os.remove(thumbnail_path)
                    debug_log(f'Removed thumbnail: {thumbnail_path}')
            except Exception as e:
                debug_log(f'Error removing thumbnail {thumbnail_path}: {e}')
        db.commit()
    except Exception as e:
        debug_log(f'Exception in purge_old_articles: {e}')
        self.retry(exc=e)
    finally:
        db.close()
        debug_log('purge_old_articles task finished')

@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    rate_limit='1/m',
    time_limit=int(os.environ.get('WORKER_TASK_TIME_LIMIT', 300)),
    soft_time_limit=int(os.environ.get('WORKER_SOFT_TIME_LIMIT', 240))
)
def enrich_articles(self):
    """Task to enrich articles that are missing summaries or images by scraping their URLs."""
    debug_log('Starting enrich_articles task')
    db = SessionLocal()
    try:
        # Find articles that need enrichment
        articles_to_enrich = db.query(Article).filter(
            (Article.description == '') | 
            (Article.thumbnail_url == None)
        ).all()
        
        debug_log(f'Found {len(articles_to_enrich)} articles to enrich')
        
        for article in articles_to_enrich:
            try:
                debug_log(f'Enriching article: {article.link}')
                
                # Fetch and parse the article
                downloaded = trafilatura.fetch_url(article.link)
                if not downloaded:
                    debug_log(f'Failed to fetch article: {article.link}')
                    continue
                
                # Extract article content
                content = trafilatura.extract(downloaded, include_images=True, include_links=True)
                if not content:
                    debug_log(f'Failed to extract content from: {article.link}')
                    continue
                
                # Parse with BeautifulSoup to find images
                soup = BeautifulSoup(downloaded, 'html.parser')
                
                # Find the first suitable image
                image_url = None
                for img in soup.find_all('img'):
                    src = img.get('src', '')
                    if src and not src.startswith('data:'):
                        # Convert relative URLs to absolute
                        if not src.startswith(('http://', 'https://')):
                            parsed_url = urlparse(article.link)
                            base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
                            src = base_url + ('' if src.startswith('/') else '/') + src
                        # Skip if it's probably an icon
                        if is_probably_icon(src):
                            continue
                        # Skip if it's a small image
                        if is_small_image(src):
                            continue
                        image_url = src
                        break
                
                # Update article with new content
                if not article.description and content:
                    article.description = content[:1000]  # Limit description length
                    article.content = content
                
                if not article.thumbnail_url and image_url:
                    thumbnail_url = save_thumbnail(image_url, article.id)
                    if thumbnail_url:
                        article.thumbnail_url = thumbnail_url
                        article.image_url = image_url
                
                db.commit()
                debug_log(f'Successfully enriched article: {article.link}')
                
                # Add a small delay between requests to be polite
                time.sleep(1)
                
            except Exception as e:
                debug_log(f'Error enriching article {article.link}: {str(e)}')
                db.rollback()
                continue
                
    except Exception as e:
        debug_log(f'Exception in enrich_articles: {e}')
        self.retry(exc=e)
    finally:
        db.close()
        debug_log('enrich_articles task finished') 