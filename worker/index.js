// Cloudflare Worker Proxy & Readability Scraper

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-FreshRSS-URL',
  'Access-Control-Max-Age': '86400'
};

export default {
  async fetch(request, env, ctx) {
    // Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 1. Auth proxy
      if (path === '/api/auth/login') {
        return handleLogin(request, env);
      }

      // 1b. Single User Auto-Login proxy
      if (path === '/api/auth/single-user') {
        return handleSingleUserLogin(request, env);
      }

      // 2. Google Reader API proxy
      if (path.startsWith('/api/greader')) {
        return handleGReaderProxy(request, env);
      }

      // 3. Full Text HTML extraction & sanitization
      if (path === '/api/full-text') {
        return handleFullTextScraper(request);
      }

      // 4. Serve React App (Static Assets fallback)
      return env.ASSETS.fetch(request);
    } catch (error) {
      return new Response(JSON.stringify({ error: 'worker_error', message: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }
  }
};

async function handleSingleUserLogin(request, env) {
  if (!env.FRESHRSS_USER || !env.FRESHRSS_PASSWORD) {
    return new Response(JSON.stringify({ error: 'not_configured', message: 'Single user mode not configured' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  const freshrssUrl = getFreshRSSUrl(request, env);
  if (!freshrssUrl) {
    return new Response(JSON.stringify({ error: 'missing_url', message: 'FreshRSS URL not found' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  const loginUrl = `${freshrssUrl}/api/greader.php/accounts/ClientLogin`;
  const body = new URLSearchParams({
    Email: env.FRESHRSS_USER,
    Passwd: env.FRESHRSS_PASSWORD
  }).toString();

  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const responseText = await response.text();
  const returnHeaders = new Headers(CORS_HEADERS);
  returnHeaders.set('Content-Type', 'text/plain');
  if (env.FRESHRSS_USER) {
    returnHeaders.set('X-FreshRSS-Username', env.FRESHRSS_USER);
  }
  return new Response(responseText, {
    status: response.status,
    headers: returnHeaders
  });
}

async function handleLogin(request, env) {
  const freshrssUrl = request.headers.get('X-FreshRSS-URL') || env.FRESHRSS_URL;
  if (!freshrssUrl) {
    return new Response(JSON.stringify({ error: 'missing_header', message: 'Missing X-FreshRSS-URL header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  // Forward form body
  const body = await request.text();
  const loginUrl = `${freshrssUrl}/api/greader.php/accounts/ClientLogin`;

  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const responseText = await response.text();
  return new Response(responseText, {
    status: response.status,
    headers: { 'Content-Type': 'text/plain', ...CORS_HEADERS }
  });
}

async function handleGReaderProxy(request, env) {
  const freshrssUrl = getFreshRSSUrl(request, env);
  if (!freshrssUrl) {
    return new Response(JSON.stringify({ error: 'missing_url', message: 'Credentials or FreshRSS URL not found' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  // Remove '/api/greader' from path
  const greaderPath = request.url.split('/api/greader')[1];
  const targetUrl = `${freshrssUrl}/api/greader.php${greaderPath}`;

  const forwardHeaders = new Headers();
  const auth = request.headers.get('Authorization');
  if (auth) {
    forwardHeaders.set('Authorization', auth);
  }
  
  // Pass along Content-Type if present
  const contentType = request.headers.get('Content-Type');
  if (contentType) {
    forwardHeaders.set('Content-Type', contentType);
  }

  const fetchOptions = {
    method: request.method,
    headers: forwardHeaders
  };

  if (request.method === 'POST') {
    fetchOptions.body = await request.text();
  }

  const response = await fetch(targetUrl, fetchOptions);
  
  // Forward binary or text correctly
  const responseBlob = await response.blob();
  const returnHeaders = new Headers(CORS_HEADERS);
  returnHeaders.set('Content-Type', response.headers.get('Content-Type') || 'application/json');

  return new Response(responseBlob, {
    status: response.status,
    headers: returnHeaders
  });
}

async function handleFullTextScraper(request) {
  const url = new URL(request.url);
  const targetUrlStr = url.searchParams.get('url');
  
  if (!targetUrlStr) {
    return new Response(JSON.stringify({ error: 'missing_param', message: 'Missing url query parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  // Fetch target website content with strict 10s timeout
  let response;
  try {
    response = await fetch(targetUrlStr, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 FreshInkScraper/1.0'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'fetch_timeout', message: 'Site took too long to respond (10s timeout)' }), {
      status: 504,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'fetch_failed', message: `Site returned HTTP status ${response.status}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  const html = await response.text();
  
  // Extract and Clean HTML (readability + sanitization server-side)
  const extractedHTML = extractMainContent(html);
  const sanitizedHTML = sanitizeServerSide(extractedHTML);

  return new Response(JSON.stringify({
    title: extractTitle(html),
    content: sanitizedHTML,
    author: extractAuthor(html),
    siteName: extractSiteName(html),
    url: targetUrlStr
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}

function getFreshRSSUrl(request, env) {
  let url = request.headers.get('X-FreshRSS-URL');
  if (!url && env && env.FRESHRSS_URL) {
    url = env.FRESHRSS_URL;
  }
  if (url) {
    return url.replace(/\/+$/, '');
  }
  return null;
}

// Extract main reading title from HTML
function extractTitle(html) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1].trim() : 'Article';
}

function extractAuthor(html) {
  const metaMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
  if (metaMatch) return metaMatch[1].trim();
  const jsonLdMatch = html.match(/"author"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/i);
  if (jsonLdMatch) return jsonLdMatch[1].trim();
  const classMatch = html.match(/<[^>]*class=["'][^"']*author[^"']*["'][^>]*>([^<]+)</i);
  if (classMatch) return classMatch[1].trim();
  return '';
}

function extractSiteName(html) {
  const ogMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
  if (ogMatch) return ogMatch[1].trim();
  return '';
}

// Server side Mozilla Readability inspired DOM-cleaner utilizing regular expressions
function extractMainContent(html) {
  // Strip head, scripts, footer, and nav blocks before finding main container
  let cleaned = html
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '');

  // Look for articles or main entries whitelists
  const bodyMatch = cleaned.match(/<article[\s\S]*?<\/article>/i) || 
                    cleaned.match(/<main[\s\S]*?<\/main>/i) || 
                    cleaned.match(/<div[^>]*?(id|class)=["'](post-content|entry-content|article-body|article-content)["'][\s\S]*?<\/div>/i);
  
  if (bodyMatch) {
    return bodyMatch[0];
  }

  // Fallback to body tag
  const bodyFallback = cleaned.match(/<body[\s\S]*?<\/body>/i);
  return bodyFallback ? bodyFallback[0] : cleaned;
}

// Enforces server-side sanitization to strip ad frames, trackers, scripts, and ugly tables
function sanitizeServerSide(dirtyHTML) {
  if (!dirtyHTML) return '';

  return dirtyHTML
    // Strip comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Strip dangerous tags completely including their children, or any stray unclosed opening tags
    .replace(/<(script|style|iframe|noscript)[\s\S]*?(<\/\1>|$)/gi, '')
    // Strip tags and inline styling properties while keeping content
    .replace(/\s*style="[^"]*"/gi, '')
    .replace(/\s*class="[^"]*"/gi, '')
    .replace(/\s*id="[^"]*"/gi, '')
    .replace(/\s*onload="[^"]*"/gi, '')
    .replace(/\s*onclick="[^"]*"/gi, '');
}
