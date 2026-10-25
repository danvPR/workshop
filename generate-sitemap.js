const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  primaryDomain: 'https://turboshare.org.uk',
  workerUrl: process.env.WORKER_URL || 'https://turboshare.org.uk',
  outputPath: path.join(__dirname, 'sitemap.xml'),
  staticRoutes: [
    { path: '', changefreq: 'daily', priority: 1.0 },
    { path: 'home', changefreq: 'daily', priority: 0.9 },
    { path: 'studios', changefreq: 'weekly', priority: 0.9 },
    { path: 'leaderboard', changefreq: 'weekly', priority: 0.8 },
    { path: 'create', changefreq: 'monthly', priority: 0.7 },
    { path: 'search', changefreq: 'weekly', priority: 0.6 },
    { path: 'chat', changefreq: 'weekly', priority: 0.7 },
    { path: 'assets', changefreq: 'weekly', priority: 0.7 },
    { path: 'creator', changefreq: 'weekly', priority: 0.7 },
    { path: 'upload', changefreq: 'monthly', priority: 0.3 },
    { path: 'settings', changefreq: 'monthly', priority: 0.3 },
    { path: 'notifications', changefreq: 'monthly', priority: 0.3 },
    { path: 'admin', changefreq: 'never', priority: 0.1 },
    { path: 'banned', changefreq: 'never', priority: 0.1 },
  ],
  knownStudioIds: [
    '_6767_',
    '1111111111111111111111111111111',
    '12vl2016',
    '12vl2016tran',
    '133492',
    '333333333333333333333',
    'Aftercode-hax-7079',
    'bububububububububububububububububu',
    'cau_ca_van_can',
    'chetguinham',
    'Conmeo',
    'Cube459',
    'LAB_Corp',
    'Meocon',
    'my-ba-khi',
    'my-soc-lo',
    'nhvlvtnm26',
    'peak-studio-69420',
    'plaza',
    'simeebatluc',
    'skibiditoiletvietnam',
    'ss3ttncd',
    'STD_1789463037835',
    'STD_1789464932736',
    'STD_1789465801495',
    'STD_1789467392860',
    'STD_1789470533119',
    'STD_1789476218487',
    'STD_1789476457443',
    'STD_1789476458547',
    'STD_1789540622034',
    'STD_1789617646858',
    'STD_1791703028033',
    'STD_1791950535070',
    'STD_1791985471423',
    'STD_1792820481430',
    'Toilameocon',
    'Tuimu',
    'who-wanna-khow'
  ],
  apiEndpoints: {
    projects: '/api/projects',
    studios: '/api/studios',
  }
};

function generateSitemap(urls) {
  const today = new Date().toISOString().split('T')[0];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?xml-stylesheet type="text/xsl" href="sitemap.xsl"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
  xml += 'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
  
  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
    xml += `    <lastmod>${url.lastmod || today}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq || 'weekly'}</changefreq>\n`;
    xml += `    <priority>${url.priority || 0.5}</priority>\n`;
    
    if (url.alternates) {
      url.alternates.forEach(alt => {
        xml += `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(alt.href)}" />\n`;
      });
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
  
  CONFIG.knownStudioIds.forEach(studioId => {
    const loc = `${domain}/studio/${studioId}`;
    urls.push({
      loc,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.7,
      alternates: [
        { hreflang: 'vi', href: `${domain}/studio/${studioId}?lang=vi` },
        { hreflang: 'en', href: `${domain}/studio/${studioId}?lang=en` }
      ]
    });
  });
  
  return urls;
}

async function fetchAllProjects() {
  const allProjects = [];
  let page = 1;
  const limit = 100;
  let hasMore = true;
  const apiBase = CONFIG.workerUrl;

  while (hasMore) {
    try {
      const url = `${apiBase}/api/projects?public=true&limit=${limit}&page=${page}&sort=recent`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        console.error(`Failed to fetch projects page ${page}: ${response.status}`);
        break;
      }

      const data = await response.json();
      
      if (data.projects && Array.isArray(data.projects)) {
        allProjects.push(...data.projects);
        hasMore = data.hasMore !== false && data.projects.length === limit;
        page++;
        console.log(`  Fetched page ${page - 1}: ${data.projects.length} projects (total: ${allProjects.length})`);
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Error fetching projects page ${page}:`, error.message);
      break;
    }
  }

  return allProjects;
}

async function fetchAllStudios() {
  try {
    const url = `${CONFIG.workerUrl}/api/studios?public=true&limit=5000`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      console.error(`Failed to fetch studios: ${response.status}`);
      return [];
    }

    const data = await response.json();
    let studios = [];
    if (Array.isArray(data)) {
      studios = data;
    } else if (data.studios && Array.isArray(data.studios)) {
      studios = data.studios;
    } else if (data.data && Array.isArray(data.data)) {
      studios = data.data;
    }
    console.log(`  Fetched ${studios.length} studios from API`);
    return studios;
  } catch (error) {
    console.error('Error fetching studios:', error.message);
    return [];
  }
}

async function fetchDynamicRoutes() {
  const dynamicUrls = [];
  const domain = CONFIG.primaryDomain;
  const usernames = new Set();

  console.log('Fetching all projects (paginated)...');
  const projects = await fetchAllProjects();
  
  projects.forEach(project => {
    const projectId = project.projectId || project.fileId || project.id || project._id || project.slug;
    if (projectId) {
      const lastmodRaw = project.updatedAt || project.date || new Date().toISOString().split('T')[0];
    const lastmod = lastmodRaw.includes('T') ? lastmodRaw.split('T')[0] : 
      lastmodRaw.includes('/') ? lastmodRaw.split(' ')[1]?.split('/').reverse().join('-') || new Date().toISOString().split('T')[0] :
      lastmodRaw.split('T')[0];
      dynamicUrls.push({
        loc: `${domain}/projects/${projectId}`,
        lastmod: lastmod.split('T')[0],
        changefreq: 'weekly',
        priority: 0.8,
        alternates: [
          { hreflang: 'vi', href: `${domain}/projects/${projectId}?lang=vi` },
          { hreflang: 'en', href: `${domain}/projects/${projectId}?lang=en` }
        ]
      });
    }

    if (project.author) {
      usernames.add(project.author);
    } else if (project.username) {
      usernames.add(project.username);
    } else if (project.creator) {
      usernames.add(project.creator);
    }
  });

  console.log('Fetching all studios...');
  const studios = await fetchAllStudios();
  
  studios.forEach(studio => {
    const studioId = studio.id || studio._id || studio.slug;
    if (studioId) {
      const lastmodRaw = studio.updatedAt || studio.date || new Date().toISOString().split('T')[0];
    const lastmod = lastmodRaw.includes('T') ? lastmodRaw.split('T')[0] : 
      lastmodRaw.includes('/') ? lastmodRaw.split(' ')[1]?.split('/').reverse().join('-') || new Date().toISOString().split('T')[0] :
      lastmodRaw.split('T')[0];
      dynamicUrls.push({
        loc: `${domain}/studio/${studioId}`,
        lastmod: lastmod.split('T')[0],
        changefreq: 'weekly',
        priority: 0.7,
        alternates: [
          { hreflang: 'vi', href: `${domain}/studio/${studioId}?lang=vi` },
          { hreflang: 'en', href: `${domain}/studio/${studioId}?lang=en` }
        ]
      });
    }

    if (studio.creator) {
      usernames.add(studio.creator);
    } else if (studio.owner) {
      usernames.add(studio.owner);
    }
  });

  usernames.forEach(username => {
    const safeUsername = encodeURIComponent(username);
    dynamicUrls.push({
      loc: `${domain}/users/${safeUsername}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.7,
      alternates: [
        { hreflang: 'vi', href: `${domain}/users/${safeUsername}?lang=vi` },
        { hreflang: 'en', href: `${domain}/users/${safeUsername}?lang=en` }
      ]
    });
  });

  return dynamicUrls;
}

async function main() {
  console.log('Generating sitemap.xml (build-time fallback)...');
  
  let allUrls = buildUrlsForDomain();
  
  console.log('Attempting to fetch dynamic content from API...');
  const dynamicUrls = await fetchDynamicRoutes();
  
  if (dynamicUrls.length > 0) {
    console.log(`Found ${dynamicUrls.length} dynamic URLs`);
    allUrls = allUrls.concat(dynamicUrls);
  } else {
    console.log('No dynamic URLs fetched (API unavailable or no content). Using static routes + known studios only.');
  }
  
  const uniqueUrls = [];
  const seen = new Set();
  allUrls.forEach(url => {
    if (!seen.has(url.loc)) {
      seen.add(url.loc);
      uniqueUrls.push(url);
    }
  });
  
  console.log(`Total unique URLs: ${uniqueUrls.length}`);
  
  const sitemap = generateSitemap(uniqueUrls);
  fs.writeFileSync(CONFIG.outputPath, sitemap, 'utf8');
  
  console.log(`Sitemap written to ${CONFIG.outputPath}`);
  console.log('Done!');
}

main().catch(err => {
  console.error('Error generating sitemap:', err);
  process.exit(1);
});