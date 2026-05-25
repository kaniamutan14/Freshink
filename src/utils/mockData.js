export const MOCK_CATEGORIES = [
  { id: 'cat_1', title: 'Technology' },
  { id: 'cat_2', title: 'Design & Craft' },
  { id: 'cat_3', title: 'Editorial & News' }
];

export const MOCK_FEEDS = [
  {
    id: 'feed_1',
    title: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    categoryId: 'cat_1',
    icon: 'https://www.theverge.com/favicon.ico'
  },
  {
    id: 'feed_2',
    title: 'Wired',
    url: 'https://www.wired.com/feed/rss',
    categoryId: 'cat_1',
    icon: 'https://www.wired.com/favicon.ico'
  },
  {
    id: 'feed_3',
    title: 'Smashing Magazine',
    url: 'https://www.smashingmagazine.com/feed',
    categoryId: 'cat_2',
    icon: 'https://www.smashingmagazine.com/favicon.ico'
  },
  {
    id: 'feed_4',
    title: 'A List Apart',
    url: 'https://alistapart.com/main/feed',
    categoryId: 'cat_2',
    icon: 'https://alistapart.com/favicon.ico'
  },
  {
    id: 'feed_5',
    title: 'Aeon Magazine',
    url: 'https://aeon.co/feed.rss',
    categoryId: 'cat_3',
    icon: 'https://aeon.co/favicon.ico'
  }
];

export const MOCK_UNREAD_COUNTS = {
  'cat_1': 3,
  'cat_2': 1,
  'cat_3': 1,
  'feed_1': 2,
  'feed_2': 1,
  'feed_3': 1,
  'feed_4': 0,
  'feed_5': 1
};

export const MOCK_ARTICLES = [
  {
    id: 'art_1',
    feedId: 'feed_1',
    title: 'The Editorial Renaissance in the Age of AI',
    author: 'Sarah Jenkins',
    published: Math.floor(Date.now() / 1000 - 3600), // 1 hour ago
    url: 'https://www.theverge.com/ai-editorial-renaissance',
    isRead: false,
    isStarred: false,
    content: `
      <p><span class="gutenberg-first-letter">A</span>s algorithmic generation floods the digital landscape, a counter-movement is quietly gathering strength: the resurgence of hand-crafted, editorial-first web publications. Readers are becoming fatigued by standardized prose and SEO-driven filler text. They are seeking spaces online that feel warm, deliberate, and curated.</p>
      <p>This is where RSS fits in. In the early 2000s, RSS was championed by developers and power-users. Today, it stands as a heroic defense against attention-hijacking infinite scroll feeds. By returning control of the feed to the reader, RSS enables an intentional relationship with media.</p>
      <blockquote>"The design of the screen must honor the rhythm of the reader's mind, not the demands of the advertising broker."</blockquote>
      <p>As we design the next generation of reading applications, we must look to typography and print design for inspiration. Deep earth tones, high-contrast layouts, generous line-heights, and customizable layout frames are not merely aesthetics; they are functional structures designed to facilitate deep focus and long-form reading.</p>
      <p>In this article, we'll examine how publications are bypassing aggregator platforms and hosting direct relationships with their audiences through dedicated feeds, custom typography, and zero-tracker layouts.</p>
    `
  },
  {
    id: 'art_2',
    feedId: 'feed_1',
    title: 'Redesigning the Browser: Retaining Focus in Chaos',
    author: 'Marcus Aurel',
    published: Math.floor(Date.now() / 1000 - 3 * 3600), // 3 hours ago
    url: 'https://www.theverge.com/redesigning-browser-focus',
    isRead: false,
    isStarred: true,
    content: `
      <p>Modern browsers have evolved from documentation readers into complex application operating systems. In the process, the simple experience of reading a piece of text has been heavily compromised by popups, banners, notifications, and media autoplays.</p>
      <p>Several boutique developers are attempting to solve this through minimalist layouts that isolate the reader view. However, a reader view is a band-aid. The ultimate solution lies in client-side aggregators that extract content directly from syndication feeds and render it inside a unified design system.</p>
      <p>By enforcing a singular design aesthetic across dozens of different publications, we create a calm, continuous reading environment. This is FreshInk's ultimate goal: to serve as a clean editorial printing press for your daily feeds.</p>
    `
  },
  {
    id: 'art_3',
    feedId: 'feed_2',
    title: 'The Silent Flight of the Web’s Forgotten Protocols',
    author: 'David Gibson',
    published: Math.floor(Date.now() / 1000 - 12 * 3600), // 12 hours ago
    url: 'https://www.wired.com/forgotten-protocols',
    isRead: false,
    isStarred: false,
    content: `
      <p>Before the web was consolidated under HTTPS and the client-server dominance of the big tech platforms, it was a wild ecosystem of decentralized protocols. Gopher, NNTP, IRC, and RSS formed a constellation of specialized channels, each optimized for specific modes of human connection.</p>
      <p>While the rest of the web moved to closed silos, RSS survived. It survived because it is built on simple, open, XML-based schemas that anyone can parse. It survived because it doesn't require a login page or an advertising network to deliver value.</p>
      <p>As decentralized protocols like ActivityPub and ATProto experience a new wave of adoption, we must remember that RSS already solved the federation problem decades ago. It remains one of the most successful, durable, and elegant protocols of the open web.</p>
    `
  },
  {
    id: 'art_4',
    feedId: 'feed_3',
    title: 'Designing for the Commute: The Offline-First Imperative',
    author: 'Vitaly Friedman',
    published: Math.floor(Date.now() / 1000 - 24 * 3600), // 1 day ago
    url: 'https://www.smashingmagazine.com/offline-first-commute',
    isRead: false,
    isStarred: false,
    content: `
      <p>When we design web applications, we often assume high-speed, persistent 5G connections. But in reality, millions of users spend their daily commute in subway tunnels, train compartments, or rural corridors with highly sporadic cellular signals.</p>
      <p>An application that breaks or hangs the moment the connection drops is failing its users during their primary reading hour. An offline-first strategy is not an advanced feature; it is a fundamental requirement of good UX.</p>
      <p>IndexedDB, CacheStorage, and Service Workers provide all the necessary building blocks to deliver instant offline loading. By caching article states locally and queueing synchronization actions, we make the boundary between online and offline completely invisible to the reader.</p>
    `
  },
  {
    id: 'art_5',
    feedId: 'feed_5',
    title: 'Silence in the Noise: The Philosophy of Curated Attention',
    author: 'Kieran Setiya',
    published: Math.floor(Date.now() / 1000 - 48 * 3600), // 2 days ago
    url: 'https://aeon.co/philosophy-curated-attention',
    isRead: true,
    isStarred: false,
    content: `
      <p>In a world characterized by constant sensory stimulation, silence is no longer just the absence of sound; it is a precious cognitive resource. The human brain was not evolved to digest hundreds of unrelated, emotionally charged micro-updates per hour.</p>
      <p>Curating one's information diet is a vital practice for maintaining mental clarity and focus. Reading long-form articles, books, and deliberate essays allows for the consolidation of knowledge rather than the shallow processing of headlines.</p>
      <p>By creating structured reading spaces that promote stillness—using deep parchment backgrounds, serif text, and removing flashy animations—we create environments where the mind can truly absorb and contemplate ideas.</p>
    `
  }
];
