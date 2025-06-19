# NewsFeed Documentation

This directory contains the documentation website for the NewsFeed project. The documentation is built using [Hugo](https://gohugo.io/) with the [Hugo Book](https://github.com/alex-shpak/hugo-book) theme.

## Online Documentation

The documentation is automatically deployed to GitHub Pages and can be accessed at:
https://beardedtek.github.io/newsfeed/

## Development

To run the documentation site locally for development:

```bash
# Using Docker
docker run --rm -it -v $(pwd):/src -p 1313:1313 klakegg/hugo:0.101.0-ext-alpine server --buildDrafts --buildFuture --bind 0.0.0.0

# Or using the docker-compose setup
docker-compose up docs
```

Then visit <http://localhost:1313> in your browser.

## Building for Production

The documentation is automatically built as part of the Nginx container's multi-stage build process. However, if you want to build the documentation separately:

```bash
# Using the build script
./build.sh

# Or manually
docker run --rm -v $(pwd):/src klakegg/hugo:0.101.0-ext-alpine
```

The built site will be in the `public/` directory.

## Structure

- `content/` - Documentation content in Markdown format
- `static/` - Static assets like images
- `themes/` - Hugo themes
- `hugo.toml` - Hugo configuration file

## Configuration Notes

The `hugo.toml` file is configured with `baseURL = '/docs/'` for the Nginx container deployment. For GitHub Pages deployment, the GitHub Actions workflow automatically creates a modified configuration with `baseURL = '/'`.

## Adding Content

To add new content:

1. Create a new Markdown file in the appropriate directory under `content/docs/`
2. Add front matter at the top of the file:

   ```yaml
   ---
   title: "Page Title"
   weight: 10
   ---
   ```

3. Write your content in Markdown

## Deployment

The documentation is deployed in two ways:

1. **Application Integration**: The documentation is served by the Nginx container at the `/docs/` path. When the NewsFeed application is deployed, the documentation is automatically built as part of the Nginx container's multi-stage build process.

2. **GitHub Pages**: The documentation is also automatically deployed to GitHub Pages whenever changes are made to the `docs/` directory in the main branch. This makes the documentation available online even without running the application.
