from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

# Association table for many-to-many relationship between articles and categories
article_category = Table(
    'article_category',
    Base.metadata,
    Column('article_id', Integer, ForeignKey('articles.id')),
    Column('category_id', Integer, ForeignKey('categories.id'))
)

# Association table for many-to-many relationship between articles and related articles
article_related = Table(
    'article_related',
    Base.metadata,
    Column('article_id', Integer, ForeignKey('articles.id')),
    Column('related_article_id', Integer, ForeignKey('articles.id'))
)

class Article(Base):
    __tablename__ = 'articles'

    id = Column(Integer, primary_key=True)
    title = Column(String(500), nullable=False)
    link = Column(String(1000), unique=True, nullable=False)
    description = Column(Text)
    content = Column(Text)
    summary = Column(Text)
    thumbnail_url = Column(String(1000))
    source_name = Column(String(200))
    source_url = Column(String(1000))
    published_at = Column(DateTime)
    processed_at = Column(DateTime, default=datetime.utcnow)
    is_processed = Column(Boolean, default=False)
    image_url = Column(String(1000))
    
    # Relationships
    categories = relationship('Category', secondary=article_category, back_populates='articles')
    related_articles = relationship(
        'Article',
        secondary=article_related,
        primaryjoin=id==article_related.c.article_id,
        secondaryjoin=id==article_related.c.related_article_id,
        backref='related_to'
    )

class Category(Base):
    __tablename__ = 'categories'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    
    # Relationships
    articles = relationship('Article', secondary=article_category, back_populates='categories') 