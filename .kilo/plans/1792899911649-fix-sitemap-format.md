# Fix Sitemap XML Format

## Problem
User reports sitemap.xml is not in correct format. The current file is valid XML but may not render properly in browsers or meet specific requirements.

## Current State
- Valid XML with proper structure (urlset, url, loc, lastmod, changefreq, priority, xhtml:link)
- Includes hreflang annotations for vi/en/x-default
- No XSL stylesheet for browser rendering

## Plan
1. **Add XSL stylesheet reference** - Add `<?xml-stylesheet type="text/xsl" href="sitemap.xsl"?>` so browsers render as formatted table/tree
2. **Create sitemap.xsl** - Simple XSLT to display URLs in a readable table with columns: URL, Last Modified, Change Frequency, Priority
3. **Validate** - Test XML still parses correctly

## Files to Modify
- `sitemap.xml` - Add stylesheet reference
- `sitemap.xsl` - New file for browser rendering

## Validation
- XML validates with xmllint
- Opens in browser as formatted table
- Search Console accepts it