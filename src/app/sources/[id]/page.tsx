'use client';

import { useEffect, useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import NewsFeed from '@/components/NewsFeed';
import { Article } from '@/types/article';

export default function SourcePage({ params }: { params: { id: string } }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sources/${params.id}/articles`);
        if (response.ok) {
          const data = await response.json();
          // Transform the articles to match our Article type
          const transformedArticles: Article[] = data.articles.map((article: any) => ({
            id: article.id,
            title: article.title,
            summary: { content: article.summary?.content || '' },
            url: article.url,
            published: article.published,
            origin: { title: article.origin },
            categories: article.categories || [],
            related: article.related || [],
            thumbnail_url: article.thumbnail_url
          }));
          setArticles(transformedArticles);
        } else {
          setError('Failed to fetch articles');
        }
      } catch (error) {
        setError('Error loading articles');
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [params.id]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading articles...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Source Articles
        </Typography>
      </Box>
      <NewsFeed initialArticles={articles} />
    </Container>
  );
} 