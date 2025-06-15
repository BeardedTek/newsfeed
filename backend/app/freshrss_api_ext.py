import os
from freshrss_api import FreshRSSAPI
import requests

class FreshRSSAPIExt(FreshRSSAPI):
    def refresh_feed(self, feed_id):
        """
        Refresh a specific feed by its ID using the proxy.
        """
        proxy_url = os.getenv('FRESHRSS_PROXY_API_URL')
        proxy_key = os.getenv('FRESHRSS_PROXY_API_KEY')
        if not proxy_url:
            raise RuntimeError('FRESHRSS_PROXY_API_URL environment variable is not set')
        if not proxy_key:
            raise RuntimeError('FRESHRSS_PROXY_API_KEY environment variable is not set')
        url = f"{proxy_url.rstrip('/')}/refresh?key={proxy_key}&id={feed_id}"
        response = requests.get(url)
        response.raise_for_status()
        return response.text

    def get_items_from_dates(self, since, until=None, limit=None, **kwargs):
        """
        Fetch items from FreshRSS between two dates. If limit is provided, only return up to that many items.
        """
        items = super().get_items_from_dates(since, until, **kwargs)
        if limit is not None:
            return items[:limit]
        return items 