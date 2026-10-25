# SEO & Sitemap Improvement Plan

## Current Issues Identified

1. **sitemap.xml** - Only contains homepage, missing all project/profile/studio pages
2. **robots.txt** - Points to old GitHub Pages URL instead of current domain
3. **Hash-based SPA routing** - Google can crawl but needs proper handling
4. **Missing structured data** for main page types (home, projects listing, profile, studios)
5. **Canonical URLs** - Hardcoded to turboshare.org.uk but site serves from multiple domains
6. **No dynamic sitemap generation** - Static file won't reflect actual content

## Implementation Tasks

### 1. Fix robots.txt
- Update sitemap URL to correct current domain(s)
- Add proper disallow rules for admin/private routes

### 2. Create Dynamic Sitemap Generation
Since this is a static site on Cloudflare Pages, create a build-time script to generate sitemap.xml from:
- Static routes (home, studios, leaderboard, create)
- Dynamic routes from API (projects, users, studios)
- Use `WORKER_URL` / API to fetch all public content

### 3. Improve index.html SEO Foundation
- Add proper meta tags for each page type (home, project, profile, studio, studios)
- Implement JSON-LD structured data for:
  - WebSite (homepage)
  - ItemList (projects listing, studios listing)
  - SoftwareApplication (project detail)
  - ProfilePage (user profile)
  - CollectionPage (studio)
- Fix canonical URL to be dynamic based on current domain
- Add hreflang for vi/en locales

### 4. Enhance Dynamic SEO Updates (JavaScript)
- Extend `updateSEO()` to handle all page types
- Add proper `injectStructuredData()` for each view
- Ensure meta tags update on hash route changes

### 5. Performance & Core Web Vitals
- Add `preload` for critical fonts/assets
- Optimize font loading (font-display: swap)
- Add resource hints (dns-prefetch, preconnect)
- Lazy-load non-critical images

### 6. Technical SEO Fixes
- Ensure sitemap.xml served with `Content-Type: application/xml`
- Add proper HTTP headers via Cloudflare Pages `_headers` file
- Fix 404.html to not redirect loops
- Add `robots` meta tag for noindex on private/auth pages

## File Changes Required

| File | Action |
|------|--------|
| `robots.txt` | Update sitemap URL |
| `sitemap.xml` | Replace with build-generated version |
| `index.html` | Add structured data, improve meta tags, dynamic canonical |
| `_headers` (new) | Add content-type and caching headers |
| `generate-sitemap.js` (new) | Build script for dynamic sitemap |
| `package.json` (new/updated) | Add build script |

## Validation Steps
1. Test sitemap.xml validates at https://www.xml-sitemaps.com/validate-xml-sitemap.html
2. Verify robots.txt accessible at domain/robots.txt
3. Check structured data with Google Rich Results Test
4. Validate no console errors on page load
5. Confirm canonical URLs match current domain
6. Test hash routes update meta tags correctly

## Open Questions

1. **Primary domain**: Should canonical URLs use `turboshare.org.uk`, `turbows.pages.dev`, or both? (Recommend: turboshare.org.uk as primary)
2. **API access**: Is there a public API endpoint to fetch all projects/users/studios for sitemap generation?
3. **Build process**: Does Cloudflare Pages run a build command? Need to add sitemap generation to build step.
4. **Private content**: Should private projects be excluded from sitemap? (Yes - only public content)