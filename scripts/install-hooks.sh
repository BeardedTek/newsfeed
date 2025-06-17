#!/bin/bash

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy pre-commit hook
cp scripts/hooks/pre-commit .git/hooks/

# Make the hook executable
chmod +x .git/hooks/pre-commit

echo "Git hooks installed successfully." 