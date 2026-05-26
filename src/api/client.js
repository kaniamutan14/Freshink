const BASE_URL = '/api';

export async function request(endpoint, options = {}) {
  // If browser is offline, return offline indicator immediately
  if (!navigator.onLine) {
    return { error: 'offline', message: 'No internet connection detected.' };
  }

  const token = localStorage.getItem('freshink_auth_token');
  const headers = {
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `GoogleLogin auth=${token}`;
  }

  const freshrssUrl = localStorage.getItem('freshink_freshrss_url');
  if (freshrssUrl) {
    headers['X-FreshRSS-URL'] = freshrssUrl;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const fetchOptions = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      // Auth expired or invalid
      localStorage.removeItem('freshink_auth_token');
      // Dispatch custom event to notify useAuth/AppContext
      window.dispatchEvent(new CustomEvent('freshink-auth-expired'));
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const text = await response.text();
      return { 
        error: 'api_error', 
        status: response.status, 
        message: text || `HTTP error! status: ${response.status}` 
      };
    }

    // Google Reader API ClientLogin returns raw text, rest returns JSON or text depending on endpoint
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error(`Request to ${url} failed:`, error);
    
    // Check if it's a network error (browser online but server down/timeout)
    if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
      return { error: 'server_unreachable', message: 'Could not contact server. Checking local database.' };
    }
    
    return { error: error.message || 'Unknown error occurred.' };
  }
}
