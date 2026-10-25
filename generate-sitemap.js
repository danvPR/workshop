const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Primary domain only - Google requires sitemap URLs to match the sitemap's domain
  primaryDomain: 'https://turboshare.org.uk',
  workerUrl: process.env.WORKER_URL || 'https://turboshare.org.uk',
  outputPath: path.join(__dirname, 'sitemap.xml'),
  // Static routes that always exist
  staticRoutes: [
    { path: '', changefreq: 'daily', priority: 1.0 },
    { path: 'home', changefreq: 'daily', priority: 0.9 },
    { path: 'studios', changefreq: 'daily', priority: 0.9 },
    { path: 'leaderboard', changefreq: 'weekly', priority: 0.8 },
    { path: 'create', changefreq: 'monthly', priority: 0.7 },
    { path: 'search', changefreq: 'weekly', priority: 0.6 },
  ],
  // API endpoints to fetch dynamic content (if available)
  apiEndpoints: {
    projects: '/api/projects?public=true&limit=10000',
    users: '/api/users?public=true&limit=10000',
    studios: '/api/studios?public=true&limit=10000',
  }
};

// Generate sitemap XML
function generateSitemap(urls) {
  const today = new Date().toISOString().split('T')[0];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
  xml += 'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
  
  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
    xml += `    <lastmod>${url.lastmod || today}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq || 'weekly'}</changefreq>\n`;
    xml += `    <priority>${url.priority || 0.5}</priority>\n`;
    
    // Add alternate language URLs (hreflang)
    if (url.alternates) {
      url.alternates.forEach(alt => {
        xml += `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(alt.href)}" />\n`;
      });
      // Add x-default
      xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(url.loc)}" />\n`;
    }
    
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  return xml;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&apos;');
}

// Build URLs for primary domain only
function buildUrlsForDomain() {
  const urls = [];
  const today = new Date().toISOString().split('T')[0];
  const domain = CONFIG.primaryDomain;
  
  CONFIG.staticRoutes.forEach(route => {
    const loc = `${domain}/${route.path}`;
    urls.push({
      loc,
      lastmod: today,
      changefreq: route.changefreq,
      priority: route.priority,
      alternates: [
        { hreflang: 'vi', href: `${domain}/${route.path}?lang=vi` },
        { hreflang: 'en', href: `${domain}/${route.path}?lang=en` }
      ]
    });
  });
  
  return urls;
}

// Fetch dynamic content from API (optional - runs if API is accessible)
async function fetchDynamicRoutes() {
  const dynamicUrls = [];
  const domain = CONFIG.primaryDomain;
  const apiBase = domain;
  
  for (const [type, endpoint] of Object.entries(CONFIG.apiEndpoints)) {
    try {
      const response = await fetch(`${apiBase}${endpoint}`, {
        headers: { 'Accept': 'application/json' },
        // Timeout after 10 seconds
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        // Handle different API response formats
        let items = [];
        if (Array.isArray(data)) {
          items = data;
        } else if (data.data && Array.isArray(data.data)) {
          items = data.data;
        } else if (data.items && Array.isArray(data.items)) {
          items = data.items;
        } else if (data.results && Array.isArray(data.results)) {
          items = data.results;
        }
        
        items.forEach(item => {
          let path = '';
          let lastmod = item.updatedAt || item.createdAt || new Date().toISOString().split('T')[0];
          
          switch (type) {
            case 'projects':
              path = `projects/${item.id || item._id || item.slug}`;
              break;
            case 'users':
              path = `users/${item.username || item.slug || item._id}`;
              break;
            case 'studios':
              path = `studio/${item.id || item._id || item.slug}`;
              break;
          }
          
          if (path) {
            dynamicUrls.push({
              loc: `${domain}/${path}`,
              lastmod,
              changefreq: 'weekly',
              priority: type === 'projects' ? 0.8 : 0.7,
              alternates: [
                { hreflang: 'vi', href: `${domain}/${path}?lang=vi` },
                { hreflang: 'en', href: `${domain}/${path}?lang=en` }
              ]
            });
          }
        });
      }
    } catch (error) {
      console.log(`Could not fetch ${type} from ${domain}: ${error.message}`);
      // Continue with other endpoints
    }
  }
  
  return dynamicUrls;
}

// Main function
async function main() {
  console.log('Generating sitemap.xml...');
  
  let allUrls = [];
  
  // Add static routes for primary domain only
  allUrls = allUrls.concat(buildUrlsForDomain());
  
  // Try to fetch dynamic routes
  console.log('Attempting to fetch dynamic content from API...');
  const dynamicUrls = await fetchDynamicRoutes();
  
  if (dynamicUrls.length > 0) {
    console.log(`Found ${dynamicUrls.length} dynamic URLs`);
    allUrls = allUrls.concat(dynamicUrls);
  } else {
    console.log('No dynamic URLs fetched (API unavailable or no content). Using static routes only.');
  }
  
  // Deduplicate by loc
  const uniqueUrls = [];
  const seen = new Set();
  allUrls.forEach(url => {
    if (!seen.has(url.loc)) {
      seen.add(url.loc);
      uniqueUrls.push(url);
    }
  });
  
  console.log(`Total unique URLs: ${uniqueUrls.length}`);
  
  // Generate and write sitemap
  const sitemap = generateSitemap(uniqueUrls);
  fs.writeFileSync(CONFIG.outputPath, sitemap, 'utf8');
  
  console.log(`Sitemap written to ${CONFIG.outputPath}`);
  console.log('Done!');
}

// Run
main().catch(err => {
  console.error('Error generating sitemap:', err);
  process.exit(1);
});