# Enhance Sitemap with Project & Profile URLs

## Goal
Generate a comprehensive `sitemap.xml` that includes all project pages (`/projects/{id}`), profile pages (`/users/{username}`), and all other application routes, using Cloudflare Workers for dynamic generation.

## Current State
- **sitemap.xml**: Static file with ~30 hardcoded studio URLs + main pages (home, studios, leaderboard, create, search)
- **sitemap.xsl**: XSLT stylesheet for pretty rendering
- **Routing**: Hash-based with clean URL conversion in `handleRouting()` (index.html:18156)
- **API**: `/api/projects` (paginated), `/api/user/{username}` (individual)

## Routing Map (from handleRouting)

| Hash Route | Clean URL | Page Type |
|------------|-----------|-----------|
| `#home` | `/` | Home |
| `#chat` | `/chat` | Chat |
| `#create` | `/create` | Create |
| `#assets` | `/assets` | Assets |
| `#studios` | `/studios` | Studios listing |
| `#studio/{id}` | `/studio/{id}` | Studio detail |
| `#leaderboard` | `/leaderboard` | Leaderboard |
| `#upload` | `/upload` | Upload |
| `#settings` | `/settings` | Settings |
| `#notifications` | `/notifications` | Notifications |
| `#admin` | `/admin` | Admin (private) |
| `#creator` | `/creator` | Creator |
| `#banned` | `/banned` | Banned (private) |
| `#profile/{username}` | `/users/{username}` | Profile |
| `#project/{id}` | `/projects/{id}` | Project detail |

## Implementation Plan

### 1. Create Cloudflare Worker for Dynamic Sitemap Generation

**File**: `workers/sitemap-worker.js`

**Approach**:
- Fetch all projects via paginated `/api/projects` calls
- Extract unique author usernames from projects
- Generate XML with all URLs
- Cache for 1 hour (stale-while-revalidate)
- Set proper `Cache-Control` headers

**URL Categories & Priority**:
| URL Pattern | Priority | Changefreq | Notes |
|-------------|----------|------------|-------|
| `/` | 1.0 | daily | Homepage |
| `/home` | 0.9 | daily | Home alias |
| `/studios` | 0.9 | weekly | Studios listing |
| `/leaderboard` | 0.8 | weekly | Leaderboard |
| `/create` | 0.7 | monthly | Create page |
| `/search` | 0.6 | weekly | Search |
| `/chat` | 0.7 | weekly | Chat |
| `/assets` | 0.7 | weekly | Assets |
| `/creator` | 0.7 | weekly | Creator |
| `/projects/{id}` | 0.7 | weekly | Project detail |
| `/studio/{id}` | 0.7 | weekly | Studio detail |
| `/users/{username}` | 0.7 | weekly | Profile |
| `/upload` | 0.3 | monthly | Auth required |
| `/settings` | 0.3 | monthly | Auth required |
| `/notifications` | 0.3 | monthly | Auth required |
| `/admin` | 0.1 | never | Private (noindex) |
| `/banned` | 0.1 | never | Private (noindex) |

**hreflang**: All URLs get `vi`, `en`, `x-default` alternates

### 2. Worker Logic

```javascript
// Pseudo-code structure
async function generateSitemap() {
  const baseUrl = 'https://turboshare.org.uk';
  const urls = [];
  
  // 1. Static pages
  addStaticPages(urls);
  
  // 2. Fetch all projects (paginated)
  const projects = await fetchAllProjects();
  projects.forEach(p => {
    urls.push({
      loc: `${baseUrl}/projects/${p.projectId || p.fileId}`,
      lastmod: p.updatedAt || p.createdAt,
      changefreq: 'weekly',
      priority: 0.7
    });
    // Collect unique usernames
    if (p.author) usernames.add(p.author);
  });
  
  // 3. Add profile URLs for discovered usernames
  usernames.forEach(username => {
    urls.push({
      loc: `${baseUrl}/users/${encodeURIComponent(username)}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.7
    });
  });
  
  // 4. Generate XML with xhtml:link hreflang
  return buildXml(urls);
}
```

### 3. Update sitemap.xml to Point to Worker

Option A: **Worker at `/sitemap.xml`** (recommended)
- Configure Cloudflare Pages to route `/sitemap.xml` to the Worker
- Original `sitemap.xml` becomes backup/fallback

Option B: **Worker at `/sitemap.xml` with build-time fallback**
- Generate static sitemap at build time as backup
- Worker overrides in production

### 4. Update sitemap.xsl (if needed)

The existing XSLT handles `xhtml:link` for hreflang. Verify it works with new URL count. No changes likely needed.

### 5. Deployment Steps

1. Create `workers/sitemap-worker.js`
2. Add to `wrangler.toml` or Pages Functions
3. Configure route: `turboshare.org.uk/sitemap.xml` → Worker
4. Test locally with `wrangler dev`
5. Deploy

## Data Flow

```
Request /sitemap.xml
    ↓
Cloudflare Worker (sitemap-worker.js)
    ↓
Fetch /api/projects?page=1,2,3... (until hasMore=false)
    ↓
Extract project URLs + unique usernames
    ↓
Build XML with all URLs + hreflang
    ↓
Return XML (Content-Type: application/xml)
    ↓
Browser/Search Engine receives complete sitemap
```

## Edge Cases

- **Large dataset**: Use streaming response or paginate sitemap (sitemap index)
- **API failures**: Return cached sitemap or static fallback
- **Private pages**: Add `<xhtml:link rel="alternate" ...>` but set `priority: 0.1` and consider `noindex` via robots.txt
- **Rate limiting**: Cache Worker response for 1 hour (`Cache-Control: public, max-age=3600, stale-while-revalidate=86400`)

## Validation

1. Worker returns valid XML
2. All URLs return 200 (spot-check)
3. hreflang links present for vi/en/x-default
4. lastmod dates are valid
5. Total URL count reasonable
6. Google Search Console accepts sitemap

## Files to Create/Modify

| File | Action |
|------|--------|
| `workers/sitemap-worker.js` | Create new Worker |
| `wrangler.toml` | Add Worker config |
| `sitemap.xml` | Keep as static fallback |
| `package.json` | Add deploy script (optional) |

## Open Questions

1. **API base URL**: What is `WORKER_URL` value? (e.g., `https://api.turboshare.org.uk`)
2. **Pagination params**: Confirm `/api/projects` accepts `page` and `limit` params
3. **Project ID field**: Confirm `projectId` or `fileId` is the correct slug for URLs
4. **User discovery**: Any other sources for usernames besides project authors?