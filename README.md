# FreshInk — Premium Editorial FreshRSS Web Reader

![Desktop View](public/desktop.png)
![Mobile View](public/mobile.png)

A state-of-the-art, mobile-first Progressive Web App (PWA) client for FreshRSS. Built with gorgeous editorial typography, natural organic earth-tone palettes, offline commute syncing, background worker parsing, and custom reading layouts.

**Note: This project was entirely built by AI.**

## Features
- **4 Premium Reading Themes**: Parchment (cream), Forest Ink (sage), Midnight Wood (dark), and Nordic Gray (slate).
- **Offline Commute Syncing**: True offline support using IndexedDB. Actions taken offline (starring, marking as read) are queued and synced automatically when you reconnect.
- **Background Article Syncing**: Utilizes Service Workers and the Periodic Background Sync API to silently fetch articles so they are ready before you even open the app.
- **Editorial Typography**: Uses Playfair Display and Source Serif 4. Features a "Gutenberg Mode" toggle to override messy inline feed CSS with a clean, double-spaced stylesheet.
- **Custom Reading Layouts**: Fluid responsive grid. Desktop supports a togglable 3-panel (Sidebar | List | Reader) or 2-panel layout. Mobile uses seamless swipe navigation.
- **Cloudflare Worker Proxy**: Bypasses CORS issues and performs heavy Readability-style HTML scraping and server-side DOM sanitization to keep your client bundle lightweight and safe.
- **Instant Client-Side Search**: Filters your cached articles instantly without network latency.

## Step-by-Step Setup Process

### Prerequisites
- Node.js (v18+)
- A FreshRSS instance with "Allow API access" enabled and an API password set.
- A Cloudflare account (for the Worker proxy).

### 1. Local Development
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Start the local Vite development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

### 2. Cloudflare Worker Deployment
The Cloudflare Worker acts as a secure API proxy and full-text scraper.
1. Navigate to the `worker/` directory:
   ```bash
   cd worker
   ```
2. Install Wrangler CLI if you haven't already:
   ```bash
   npm install -g wrangler
   ```
3. Update `wrangler.toml` with your FreshRSS URL.
4. Deploy the worker:
   ```bash
   wrangler deploy
   ```

### 3. PWA Production Build
1. Build the production client bundle:
   ```bash
   npm run build
   ```
2. Deploy the `dist/` directory to any static host (e.g., Cloudflare Pages, Vercel, Netlify).
3. Open the app on your mobile device and tap "Add to Home Screen" to install it as a native PWA for full background sync support.

## License
MIT License
