import { request } from './client';

export async function login(freshrssUrl, username, password) {
  // Save URL to localstorage for client-side routing/workers
  localStorage.setItem('freshink_freshrss_url', freshrssUrl);

  const params = new URLSearchParams();
  params.append('Email', username);
  params.append('Passwd', password);

  // Send request via Cloudflare Worker proxy
  const result = await request('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-FreshRSS-URL': freshrssUrl
    },
    body: params.toString()
  });

  if (result.error) return result;

  // Google Reader ClientLogin response is text:
  // SID=...
  // LSID=...
  // Auth=AUTH_TOKEN
  const match = result.match(/Auth=([^\s]+)/);
  if (match && match[1]) {
    const token = match[1];
    localStorage.setItem('freshink_auth_token', token);
    localStorage.setItem('freshink_user', username);
    return { token, username };
  }

  return { error: 'login_failed', message: 'Could not extract auth token from response.' };
}

export async function getWriteToken() {
  const token = await request('/greader/reader/api/0/token', {
    method: 'GET'
  });
  
  if (typeof token === 'string' && token.trim()) {
    localStorage.setItem('freshink_write_token', token.trim());
    return token.trim();
  }
  
  return token;
}

export async function getCategories() {
  return request('/greader/reader/api/0/tag/list?output=json');
}

export async function getSubscriptions() {
  return request('/greader/reader/api/0/subscription/list?output=json');
}

export async function getUnreadCounts() {
  return request('/greader/reader/api/0/unread-count?output=json');
}

// streamId is usually:
// - All articles: 'user/-/state/com.google/reading-list'
// - Starred: 'user/-/state/com.google/starred'
// - Feed: 'feed/FEED_ID'
// - Category: 'user/-/label/CATEGORY_NAME'
export async function getArticles(streamId, options = {}) {
  const { count = 20, continuation = null, filter = 'all' } = options;
  
  let endpoint = `/greader/reader/api/0/stream/contents/${encodeURIComponent(streamId)}?output=json&n=${count}`;
  
  if (continuation) {
    endpoint += `&c=${continuation}`;
  }
  
  if (filter === 'unread') {
    // com.google/read tag exclusion excludes read articles
    endpoint += '&xt=user/-/state/com.google/read';
  }
  
  return request(endpoint);
}

export async function editTag(itemId, addTag = null, removeTag = null, retry = true) {
  let writeToken = localStorage.getItem('freshink_write_token');
  if (!writeToken) {
    writeToken = await getWriteToken();
  }

  const params = new URLSearchParams();
  params.append('i', itemId);
  params.append('T', writeToken);
  
  if (addTag) {
    params.append('a', addTag);
  }
  if (removeTag) {
    params.append('r', removeTag);
  }

  const result = await request('/greader/reader/api/0/edit-tag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  // Retry once if token expired or request failed
  if (result && result.error && retry) {
    localStorage.removeItem('freshink_write_token');
    return editTag(itemId, addTag, removeTag, false);
  }

  return result;
}

export async function markRead(itemId) {
  return editTag(itemId, 'user/-/state/com.google/read', null);
}

export async function markUnread(itemId) {
  return editTag(itemId, null, 'user/-/state/com.google/read');
}

export async function star(itemId) {
  return editTag(itemId, 'user/-/state/com.google/starred', null);
}

export async function unstar(itemId) {
  return editTag(itemId, null, 'user/-/state/com.google/starred');
}

export async function markAllRead(streamId, retry = true) {
  let writeToken = localStorage.getItem('freshink_write_token');
  if (!writeToken) {
    writeToken = await getWriteToken();
  }

  const params = new URLSearchParams();
  params.append('s', streamId);
  params.append('T', writeToken);

  const result = await request('/greader/reader/api/0/mark-all-as-read', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (result && result.error && retry) {
    localStorage.removeItem('freshink_write_token');
    return markAllRead(streamId, false);
  }

  return result;
}

// Pull full article content via Cloudflare Worker Readability Scraper
export async function fetchFullText(articleUrl) {
  return request(`/full-text?url=${encodeURIComponent(articleUrl)}`);
}

// Google Reader API search queries the server for full-history match
export async function searchArticles(query) {
  return request(`/greader/reader/api/0/stream/contents/user/-/state/com.google/reading-list?output=json&q=${encodeURIComponent(query)}`);
}
