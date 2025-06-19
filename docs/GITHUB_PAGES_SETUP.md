# Setting Up GitHub Pages for NewsFeed Documentation

To enable the automatic deployment of documentation to GitHub Pages, follow these steps:

## 1. Enable GitHub Pages in Repository Settings

1. Go to your repository on GitHub
2. Click on "Settings" (near the top right)
3. Scroll down to the "GitHub Pages" section (or click on "Pages" in the left sidebar)
4. Under "Build and deployment", select:
   - Source: "GitHub Actions"
5. Click "Save"

## 2. First Deployment

The first deployment will happen automatically when:
- You push changes to the `docs/` directory on the `main` branch, or
- You manually trigger the workflow

To manually trigger the workflow:
1. Go to the "Actions" tab in your repository
2. Click on "Deploy Documentation to GitHub Pages" in the left sidebar
3. Click on "Run workflow" dropdown
4. Select the "main" branch
5. Click "Run workflow"

## 3. Accessing the Documentation

Once deployed, your documentation will be available at:
```
https://beardedtek.github.io/newsfeed/
```

## 4. Custom Domain (Optional)

If you want to use a custom domain for your documentation:

1. Go to your repository's "Settings"
2. Navigate to "Pages"
3. Under "Custom domain", enter your domain name
4. Click "Save"
5. Follow the instructions to configure your DNS settings

Note: If you use a custom domain, update the documentation links in the README and other files accordingly. 