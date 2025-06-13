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
from freshrss_api import FreshRSSAPI
from loguru import logger

from app.database import SessionLocal
from app.models.database import Article, Category

# Initialize Celery with optimized settings
celery_app = Celery('newsfeed', 
    broker=os.getenv('REDIS_URL', 'redis://redis:6379/0'),
    broker_connection_retry_on_startup=True,
    worker_prefetch_multiplier=1,  # Process one task at a time
    task_acks_late=True,  # Only acknowledge task after completion
    task_reject_on_worker_lost=True,  # Requeue task if worker dies
    task_time_limit=300,  # 5 minute timeout
    task_soft_time_limit=240,  # 4 minute soft timeout
    worker_max_tasks_per_child=100,  # Restart worker after 100 tasks
    worker_max_memory_per_child=200000  # Restart worker after 200MB memory usage
)

# Initialize Redis (only for Celery broker)
redis_client = redis.Redis.from_url(os.getenv('REDIS_URL', 'redis://redis:6379/0'))

# Constants
THUMB_SIZE = 96  # w-24 h-24 in pixels
CATEGORIES = [
    'Politics', 'US', 'World', 'Sports', 'Technology', 
    'Entertainment', 'Science', 'Health', 'Business'
]

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

def get_freshrss_client() -> FreshRSSAPI:
    """Create and return a FreshRSS API client instance using environment variables."""
    try:
        client = FreshRSSAPI(verbose=True)  # Uses env vars
        return client
    except Exception as e:
        logger.error(f"Failed to initialize FreshRSS client: {str(e)}")
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

async def fetch_articles(batch_size=100) -> List[Dict[str, Any]]:
    try:
        client = get_freshrss_client()
        # Calculate timestamp for 3 days ago
        three_days_ago = datetime.utcnow() - timedelta(days=3)
        # Get items from the last 3 days
        items = client.get_items_from_dates(
            since=three_days_ago,
            limit=batch_size
        )
        # Convert items to the format we need
        articles = []
        for item in items:
            article = {
                "id": str(item["id"]),
                "title": item["title"],
                "content": item["content"],
                "published": int(item["created_on_time"]),
                "author": item.get("author"),
                "url": item["url"],
                "categories": item.get("categories", []),
                "enclosure_url": item.get("enclosure_url", "")
            }
            articles.append(article)
        return articles
    except Exception as e:
        logger.error(f"Error fetching articles from FreshRSS: {str(e)}")
        return []

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
            print(f"Sending request to Ollama at {os.getenv('OLLAMA_URL')} with model {os.getenv('OLLAMA_MODEL')}")
            res = await client.post(
                f"{os.getenv('OLLAMA_URL')}/api/generate",
                json={
                    "model": os.getenv('OLLAMA_MODEL', 'llama2'),
                    "prompt": prompt,
                    "stream": False
                }
            )
            if res.status_code != 200:
                print(f"Error from Ollama API: {res.status_code} - {res.text}")
                return keyword_based_categorization(text)
            
            data = res.json()
            print(f"Raw Ollama response: {data}")
            
            if 'response' not in data:
                print("No 'response' field in Ollama response")
                return keyword_based_categorization(text)
            
            match = re.search(r"\[.*\]", data['response'])
            if not match:
                print(f"Could not find JSON array in response: {data['response']}")
                return keyword_based_categorization(text)
            
            try:
                categories = json.loads(match.group(0))
                print(f"Parsed categories: {categories}")
                # Filter out any categories that aren't in our predefined list and limit to 3
                valid_categories = [cat for cat in categories if cat in CATEGORIES][:3]
                print(f"Valid categories (max 3): {valid_categories}")
                return valid_categories
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON from response: {e}")
                return keyword_based_categorization(text)
    except Exception as e:
        print(f"Error in categorize_article: {str(e)}")
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

async def generate_thumbnail(image_url: str) -> bytes:
    async with httpx.AsyncClient() as client:
        res = await client.get(image_url)
        if res.status_code != 200:
            return None
        img = Image.open(io.BytesIO(res.content))
        img.thumbnail((THUMB_SIZE, THUMB_SIZE))
        webp_io = io.BytesIO()
        img.save(webp_io, format='WEBP')
        return webp_io.getvalue()

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Run every 15 minutes using crontab for more precise scheduling
    sender.add_periodic_task(
        crontab(minute='*/15'),  # Every 15 minutes
        process_articles.s(),
        name='process_articles_every_15_minutes'
    )
    
    # Run purge task daily at midnight
    sender.add_periodic_task(
        crontab(hour=0, minute=0),  # Every day at midnight
        purge_old_articles.s(),
        name='purge_old_articles_daily'
    )
    
    # Also trigger the initial article fetch
    print("Triggering initial article fetch...")
    process_articles.delay()

@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,  # 1 minute between retries
    rate_limit='1/m'  # Maximum 1 task per minute
)
def process_articles(self):
    print("Starting article fetch process...")
    db = SessionLocal()
    try:
        loop = asyncio.get_event_loop()
        print("Fetching articles from FreshRSS in batches of 100...")
        fresh_articles = loop.run_until_complete(fetch_articles(batch_size=100))
        print(f"Fetched {len(fresh_articles)} articles from FreshRSS")
        # Process articles in smaller batches
        BATCH_SIZE = 10
        for i in range(0, len(fresh_articles), BATCH_SIZE):
            batch = fresh_articles[i:i + BATCH_SIZE]
            print(f"Processing batch {i//BATCH_SIZE + 1} of {(len(fresh_articles) + BATCH_SIZE - 1)//BATCH_SIZE}")
            for fresh_article in batch:
                try:
                    article_link = fresh_article.get('url', '')
                    if not article_link:
                        continue
                    existing_article = db.query(Article).filter(Article.link == article_link).first()
                    if existing_article and existing_article.is_processed:
                        continue
                    print(f"Processing new article: {fresh_article.get('title', '')}")
                    article_data = {
                        'title': fresh_article.get('title', ''),
                        'link': article_link,
                        'description': fresh_article.get('content', ''),
                        'content': fresh_article.get('content', ''),
                        'source_name': fresh_article.get('author', ''),
                        'source_url': '',
                        'published_at': datetime.fromtimestamp(fresh_article.get('date', 0)),
                        'processed_at': datetime.utcnow(),
                        'is_processed': False
                    }
                    if existing_article:
                        for key, value in article_data.items():
                            setattr(existing_article, key, value)
                        article = existing_article
                    else:
                        article = Article(**article_data)
                        db.add(article)
                        db.commit()
                        db.refresh(article)
                    # Process categories if needed
                    if not article.categories:
                        print(f"Processing categories for article: {article.title}")
                        text = f"{article.title} {article.description}"
                        categories = loop.run_until_complete(categorize_article(text))
                        print(f"Got categories for article {article.id}: {categories}")
                        for category_name in categories:
                            category = get_or_create_category(db, category_name)
                            article.categories.append(category)
                        print(f"Final categories for article {article.id}: {[c.name for c in article.categories]}")
                    # Process related articles if needed
                    if not article.related_articles:
                        print(f"Finding related articles for: {article.title}")
                        all_articles = db.query(Article).all()
                        related = find_related_articles(db, article, all_articles)
                        article.related_articles.extend(related)
                        print(f"Found {len(related)} related articles")
                    # Process thumbnail if needed
                    if not article.thumbnail_url:
                        enclosures = fresh_article.get('enclosures', [])
                        image_url = enclosures[0]['url'] if enclosures and 'url' in enclosures[0] else ''
                        if image_url:
                            print(f"Generating thumbnail for: {article.title}")
                            thumbnail = loop.run_until_complete(generate_thumbnail(image_url))
                            if thumbnail:
                                article.thumbnail_url = image_url
                                print("Thumbnail generated successfully")
                    article.is_processed = True
                    db.commit()
                    print(f"Successfully processed article: {article.title}")
                except Exception as e:
                    db.rollback()
                    print(f"Error processing article: {e}")
                    continue
            # Add a small delay between batches to reduce CPU load
            time.sleep(1)
    except Exception as e:
        db.rollback()
        print(f"Error in process_articles: {e}")
        # Retry the task if it fails
        self.retry(exc=e)
    finally:
        db.close()
        print("Article fetch process completed")

@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,  # 1 minute between retries
    rate_limit='1/m'  # Maximum 1 task per minute
)
def purge_old_articles(self):
    """Purge articles older than 7 days."""
    print("Starting article purge process...")
    db = SessionLocal()
    try:
        # Calculate timestamp for 7 days ago
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        # Find and delete old articles
        old_articles = db.query(Article).filter(Article.published_at < seven_days_ago).all()
        count = len(old_articles)
        
        for article in old_articles:
            db.delete(article)
        
        db.commit()
        print(f"Successfully purged {count} articles older than 7 days")
    except Exception as e:
        db.rollback()
        print(f"Error in purge_old_articles: {e}")
        # Retry the task if it fails
        self.retry(exc=e)
    finally:
        db.close() 