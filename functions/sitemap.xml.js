export async function onRequestGet(context) {
  const { env, request } = context;
  const BASE_URL = 'https://turboshare.org.uk';
  const WORKER_URL = env.WORKER_URL || BASE_URL;
  const today = new Date().toISOString().split('T')[0];

  function parseDate(dateStr) {
    if (!dateStr) return today;
    if (dateStr.includes('T')) return dateStr.split('T')[0];
    if (dateStr.includes('/')) {
      const parts = dateStr.split(' ')[1]?.split('/');
      if (parts && parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return today;
  }

  const staticRoutes = [
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
  ];

  const urls = [];

  staticRoutes.forEach(route => {
    const loc = `${BASE_URL}/${route.path}`;
    urls.push({
      loc,
      lastmod: today,
      changefreq: route.changefreq,
      priority: route.priority,
      alternates: [
        { hreflang: 'vi', href: `${BASE_URL}/${route.path}?lang=vi` },
        { hreflang: 'en', href: `${BASE_URL}/${route.path}?lang=en` }
      ]
    });
  });

  async function fetchAllProjects() {
    const allProjects = [];
    let page = 1;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      try {
        const url = `${WORKER_URL}/api/projects?public=true&page=${page}&limit=${limit}&sort=recent`;
        const response = await fetch(url, {
          headers: { 'Accept': 'application/json' },
          cf: { cacheTtl: 300, cacheEverything: true }
        });

        if (!response.ok) {
          console.error(`Failed to fetch projects page ${page}: ${response.status}`);
          break;
        }

        const data = await response.json();
        
        let projects = [];
        if (Array.isArray(data)) {
          projects = data;
        } else if (data.projects && Array.isArray(data.projects)) {
          projects = data.projects;
          hasMore = data.hasMore !== false && projects.length === limit;
        } else if (data.data && Array.isArray(data.data)) {
          projects = data.data;
          hasMore = data.hasMore !== false && projects.length === limit;
        } else {
          hasMore = false;
        }

        if (projects.length === 0) {
          hasMore = false;
        } else {
          allProjects.push(...projects);
          page++;
        }
      } catch (error) {
        console.error(`Error fetching projects page ${page}:`, error);
        break;
      }
    }

    return allProjects;
  }

  try {
    const projects = await fetchAllProjects();
    const usernames = new Set();

    projects.forEach(project => {
      const projectId = project.projectId || project.fileId || project.id || project._id || project.slug;
      if (projectId) {
        const lastmod = parseDate(project.updatedAt || project.date);
        urls.push({
          loc: `${BASE_URL}/projects/${projectId}`,
          lastmod,
          changefreq: 'weekly',
          priority: 0.8,
          alternates: [
            { hreflang: 'vi', href: `${BASE_URL}/projects/${projectId}?lang=vi` },
            { hreflang: 'en', href: `${BASE_URL}/projects/${projectId}?lang=en` }
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

    usernames.forEach(username => {
      const safeUsername = encodeURIComponent(username);
      urls.push({
        loc: `${BASE_URL}/users/${safeUsername}`,
        lastmod: today,
        changefreq: 'weekly',
        priority: 0.7,
        alternates: [
          { hreflang: 'vi', href: `${BASE_URL}/users/${safeUsername}?lang=vi` },
          { hreflang: 'en', href: `${BASE_URL}/users/${safeUsername}?lang=en` }
        ]
      });
    });

    try {
      const studiosResponse = await fetch(`${WORKER_URL}/api/studios?public=true&limit=5000`, {
        headers: { 'Accept': 'application/json' },
        cf: { cacheTtl: 300, cacheEverything: true }
      });

      if (studiosResponse.ok) {
        const studiosData = await studiosResponse.json();
        let studios = [];
        if (Array.isArray(studiosData)) {
          studios = studiosData;
        } else if (data?.studios && Array.isArray(studiosData.studios)) {
          studios = studiosData.studios;
        } else if (studiosData?.data && Array.isArray(studiosData.data)) {
          studios = studiosData.data;
        }

        studios.forEach(studio => {
          const studioId = studio.id || studio._id || studio.slug;
          if (studioId) {
            const lastmod = parseDate(studio.updatedAt || studio.date);
            urls.push({
              loc: `${BASE_URL}/studio/${studioId}`,
              lastmod,
              changefreq: 'weekly',
              priority: 0.7,
              alternates: [
                { hreflang: 'vi', href: `${BASE_URL}/studio/${studioId}?lang=vi` },
                { hreflang: 'en', href: `${BASE_URL}/studio/${studioId}?lang=en` }
              ]
            });
          }

          if (studio.creator) {
            usernames.add(studio.creator);
          } else if (studio.owner) {
            usernames.add(studio.owner);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching studios:', error);
    }

  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
  }

  const uniqueUrls = [];
  const seen = new Set();
  urls.forEach(url => {
    if (!seen.has(url.loc)) {
      seen.add(url.loc);
      uniqueUrls.push(url);
    }
  });

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?xml-stylesheet type="text/xsl" href="sitemap.xsl"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
  xml += 'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  uniqueUrls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;

    if (url.alternates) {
      url.alternates.forEach(alt => {
        xml += `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(alt.href)}" />\n`;
      });
      xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(url.loc)}" />\n`;
    }

    xml += '  </url>\n';
  });

  xml += '</urlset>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    }
  });
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&apos;');
}