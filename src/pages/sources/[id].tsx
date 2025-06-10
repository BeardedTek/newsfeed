import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import NewsFeed from '@/components/NewsFeed';
import { Article } from '../../types/article';

export default function SourcePage() {
  const router = useRouter();
  const { id } = router.query;
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/sources/${id}/articles`);
        if (response.ok) {
          const data = await response.json();
          setArticles(data.articles);
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
  }, [id]);

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