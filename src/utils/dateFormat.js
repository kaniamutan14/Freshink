export function formatRelativeTime(timestampSeconds) {
  if (!timestampSeconds) return '';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - Number(timestampSeconds);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  
  if (diff < 172800) return 'Yesterday';
  
  // Return readable month and day
  const date = new Date(timestampSeconds * 1000);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatFullDate(timestampSeconds) {
  if (!timestampSeconds) return '';
  const date = new Date(timestampSeconds * 1000);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function calculateReadingTime(htmlContent) {
  if (!htmlContent) return '1 min read';
  
  // Strip tags to get raw words
  const text = htmlContent.replace(/<[^>]*>?/gm, '');
  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  
  const minutes = Math.ceil(wordCount / 200); // 200 words per minute
  return `${minutes} min read`;
}
