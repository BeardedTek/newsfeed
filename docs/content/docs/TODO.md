---
title: "Code Cleanup TODO"
weight: 100
---

# Code Cleanup TODO

This document lists potential code cleanup items identified in the codebase. These items represent code that may be unused, redundant, or could benefit from refactoring.

## Frontend

### Duplicate Admin Role Checking
- The `hasAdminRole` function is duplicated across multiple admin pages:
  - `frontend/src/app/admin/sources/page.tsx`
  - `frontend/src/app/admin/categories/page.tsx`
  - `frontend/src/app/admin/rebuild/page.tsx`
  - `frontend/src/app/admin/settings/page.tsx`
- **Recommendation**: Create a shared utility function in a common location.

### Unused Components/Functions
- `PlausibleScript.tsx` component - appears to be unused if analytics is not configured
- Several utility functions in `NewsFeed.tsx` that may not be used everywhere:
  - `stripHtmlAndTruncate`
  - `jaccardSimilarity`
  - `normalizeArticle`
- **Recommendation**: Verify usage and remove if unnecessary.

### Removed Avatar Generation
- We already removed the avatar generation functionality, but there might be leftover code or references
- **Recommendation**: Check for any remaining references to avatar generation.

## Backend

### Commented Debug Code
- Several commented debug print statements in `caching.py`
- **Recommendation**: Clean up for code clarity.

### Potentially Unused Functions
- `convert_timestamp_to_timezone` in `workers/tasks.py` 
- `debug_log` in `api/__init__.py` - might only be used during development
- **Recommendation**: Verify usage and remove if unnecessary.

### Duplicate Utility Functions
- Similar Jaccard similarity implementations in both frontend and backend
- Multiple URL extraction and formatting functions
- **Recommendation**: Consider consolidating into shared utility functions.

## Documentation Theme

### Deprecated Features
- Section shortcode is marked as deprecated in `docs/themes/hugo-book/layouts/_shortcodes/section.html`
- Several experimental features marked with "/!\" warnings in Hugo configuration files
- **Recommendation**: Update to use recommended alternatives or remove.

### Unused Commenting System
- Disqus template integration that may not be used
- **Recommendation**: Remove if not being used.

## General

### Duplicate Code Patterns
- Similar click handler logic for menu items
- Repeated API request patterns
- **Recommendation**: Extract into reusable components or utility functions.

## Next Steps

Before removing any code:
1. Verify that the identified code is truly unused
2. Consider the impact of removal on other parts of the codebase
3. Implement changes incrementally with appropriate testing
4. Update documentation as needed 