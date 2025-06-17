---
weight: 50
title: "Git Hooks"
---

# Git Hooks

NewsFeed includes Git hooks to automate certain tasks during development and deployment.

## Available Hooks

### Pre-commit Hook

The pre-commit hook automatically rebuilds the documentation site when files in the `docs/` or `content/` directories are modified. This ensures that the documentation is always up-to-date with the latest changes.

#### What it does

When you commit changes that include modifications to files in the `docs/` or `content/` directories, the pre-commit hook:

1. Temporarily stashes any unstaged changes
2. Runs the `docs/build.sh` script to rebuild the documentation
3. Adds the generated files to your commit
4. Restores any stashed changes
5. Allows the commit to proceed if the build was successful

#### Benefits

- Ensures documentation is always built before committing
- Prevents outdated or broken documentation from being committed
- Automates the documentation build process
- Maintains consistency across the project

## Installation

To install the Git hooks:

```bash
./scripts/install-hooks.sh
```

This script will:
1. Create the `.git/hooks` directory if it doesn't exist
2. Copy the pre-commit hook to the appropriate location
3. Make the hook executable

## Manual Setup

If you prefer to set up the hooks manually:

```bash
# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy the pre-commit hook
cp scripts/hooks/pre-commit .git/hooks/

# Make it executable
chmod +x .git/hooks/pre-commit
```

## Skipping Hooks

If you need to bypass the pre-commit hook for a specific commit:

```bash
git commit --no-verify -m "Your commit message"
```

However, this is not recommended as it may lead to inconsistent documentation.

## Troubleshooting

### Hook Not Running

If the pre-commit hook is not running:

1. Ensure the hook is executable:
   ```bash
   chmod +x .git/hooks/pre-commit
   ```

2. Verify the hook is in the correct location:
   ```bash
   ls -la .git/hooks/pre-commit
   ```

### Documentation Build Failing

If the documentation build fails during the pre-commit hook:

1. Run the build script manually to see the error:
   ```bash
   cd docs
   ./build.sh
   ```

2. Fix any issues in the documentation
3. Try committing again 