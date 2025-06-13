export interface Article {
  id: string;
  title: string;
  summary: { content: string };
  url: string;
  published: number;
  origin: { title: string };
  categories: string[];
  related: string[];
  thumbnail_url?: string;
} 