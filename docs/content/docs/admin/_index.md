---
weight: 20
title: "Admin Dashboard Guide"
bookCollapseSection: true
---


# Admin Dashboard Guide

This section provides detailed information on how to use the NewsFeed admin dashboard to manage and configure your NewsFeed instance.

## **NOTE: FEATURES MAY NOT BE COMPLETE**

The features listed in this documentation may not be accurate.  THe admin console is currently being planned out and this document serves as a guide to what it ***should*** look like when it is complete.

## Accessing the Admin Dashboard

To access the admin dashboard:

1. Log in with an administrator account
2. Click on the "Admin" link in the navigation bar
3. You will be redirected to the admin dashboard

## Dashboard Overview

The admin dashboard provides several sections:

1. **Overview** - System status and statistics
2. **Categories** - Manage content categories
3. **Sources** - Manage news sources
4. **Related Articles** - Configure related article settings
5. **Settings** - System-wide configuration
6. **Rebuild** - Trigger system rebuilds and updates

## Managing Categories

The Categories section allows you to:

- View all existing categories
- Create new categories
- Edit category names and descriptions
- Delete categories
- Merge categories

### Adding a New Category

1. Navigate to the Categories section
2. Click "Add New Category"
3. Enter a name and description
4. Click "Save"

### Editing Categories

1. Find the category in the list
2. Click the "Edit" button
3. Make your changes
4. Click "Save"

## Managing Sources

The Sources section allows you to:

- View all configured news sources
- Add new sources
- Edit source details
- Enable/disable sources
- Delete sources

### Adding a New Source

1. Navigate to the Sources section
2. Click "Add New Source"
3. Enter the source details:
   - Name
   - URL
   - Feed URL
   - Category (optional)
4. Click "Save"

## Related Articles

Configure how related articles are determined:

- Similarity threshold
- Maximum number of related articles
- Algorithms used for determining relatedness

## System Settings

The Settings section allows you to configure:

- Cache duration
- Default article display count
- Worker task frequency
- Authentication settings
- API rate limits

## Rebuilding the System

The Rebuild section provides tools to:

- Rebuild the article index
- Clear caches
- Reprocess articles
- Update category assignments

This is useful after making significant changes to categories or sources. 