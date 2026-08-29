// Shared helpers for the /api/blog/* serverless functions. Posts are
// fetched straight from Supabase's REST API (no @supabase/supabase-js
// dependency needed) using the anon key, same as any other public,
// RLS-gated read — see gabspace/supabase/migrations/20260829000000_blog_posts.sql
// for the table and policies this relies on.

import { marked } from 'marked'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

const POST_COLUMNS = 'id,slug,title,excerpt,content,cover_image_url,seo_title,seo_description,published_at'

async function supabaseSelect(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?${query}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })
  if (!res.ok) throw new Error(`Supabase request failed: ${res.status}`)
  return res.json()
}

export async function fetchPublishedPosts({ limit = 20, offset = 0 } = {}) {
  const query = `select=${POST_COLUMNS}&status=eq.published&order=published_at.desc&limit=${limit}&offset=${offset}`
  return supabaseSelect(query)
}

export async function fetchPostBySlug(slug) {
  const query = `select=${POST_COLUMNS}&status=eq.published&slug=eq.${encodeURIComponent(slug)}&limit=1`
  const rows = await supabaseSelect(query)
  return rows[0] || null
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderMarkdown(md) {
  return marked.parse(md || '')
}

const SITE_URL = 'https://gabspace.io'

// Wraps page content in the same brand shell (nav/footer/tokens) as the
// static homepage, so blog pages look native rather than bolted on.
export function pageShell({ title, description, canonicalPath, ogImage, jsonLd, bodyHtml }) {
  const canonicalUrl = `${SITE_URL}${canonicalPath}`
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}"/>
<link rel="canonical" href="${canonicalUrl}"/>
<link rel="icon" type="image/svg+xml" href="/assets/img/favicon.svg"/>
<meta property="og:type" content="article"/>
<meta property="og:title" content="${escapeHtml(title)}"/>
<meta property="og:description" content="${escapeHtml(description)}"/>
<meta property="og:url" content="${canonicalUrl}"/>
${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}"/>` : ''}
<meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}"/>
<meta name="twitter:title" content="${escapeHtml(title)}"/>
<meta name="twitter:description" content="${escapeHtml(description)}"/>
${ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}"/>` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --ink: #2B1A2A; --ink2: #6B7280; --ink3: #9CA3AF; --cream: #F5F5F7; --white: #FFFFFF;
  --sage: #1F9C8F; --violet: #6A3F7A; --violet-pale: #EDE5F4; --border: #E2E2E4; --border-soft: #F0F0F2;
  --gradient: linear-gradient(90deg, #4FA8E8 0%, #3FD6C8 50%, #A9AEBB 100%);
  --orb-gradient: radial-gradient(circle at 35% 30%, #7FD8FF 0%, #4FA8E8 55%, #6A5CD0 100%);
  --radius: 12px; --radius-lg: 18px; --radius-pill: 100px;
}
body { font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif; background: var(--cream); color: var(--ink); font-size: 16px; line-height: 1.6; -webkit-font-smoothing: antialiased; }
a { text-decoration: none; color: inherit; }
nav { display: flex; align-items: center; justify-content: space-between; padding: 1.1rem 2.5rem; border-bottom: 0.5px solid var(--border-soft); background: var(--cream); position: sticky; top: 0; }
.logo-wrap { display: flex; align-items: center; gap: 10px; }
.logo-mark { width: 34px; height: 34px; flex-shrink: 0; background: var(--orb-gradient); border-radius: 42% 58% 65% 35% / 45% 40% 60% 55%; box-shadow: 0 0 14px rgba(79,168,232,0.45); }
.logo-name { font-family: 'Space Grotesk', sans-serif; font-size: 1.3rem; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 0.6rem 1.2rem; border-radius: var(--radius-pill); font-size: 0.875rem; font-weight: 600; }
.btn-primary { background: var(--ink); color: var(--white); }
main { max-width: 760px; margin: 0 auto; padding: 3rem 1.5rem 5rem; }
.eyebrow { font-family: 'Space Grotesk', sans-serif; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: var(--violet); margin-bottom: 0.75rem; }
h1 { font-family: 'Space Grotesk', sans-serif; font-size: 2.1rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.75rem; }
.post-meta { color: var(--ink3); font-size: 0.875rem; margin-bottom: 2rem; }
.post-cover { width: 100%; border-radius: var(--radius-lg); margin-bottom: 2rem; }
.post-body h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.4rem; margin: 2rem 0 0.75rem; }
.post-body h3 { font-family: 'Space Grotesk', sans-serif; font-size: 1.15rem; margin: 1.5rem 0 0.5rem; }
.post-body p { margin-bottom: 1.1rem; }
.post-body a { color: var(--violet); text-decoration: underline; }
.post-body ul, .post-body ol { margin: 0 0 1.1rem 1.4rem; }
.post-body img { max-width: 100%; border-radius: var(--radius); }
.post-body blockquote { border-left: 3px solid var(--violet); padding-left: 1rem; color: var(--ink2); margin: 0 0 1.1rem; }
.post-body pre { background: var(--white); border: 0.5px solid var(--border); border-radius: var(--radius); padding: 1rem; overflow-x: auto; margin-bottom: 1.1rem; }
.post-list-item { padding: 1.5rem 0; border-bottom: 0.5px solid var(--border-soft); }
.post-list-item h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.3rem; margin-bottom: 0.4rem; }
.post-list-item h2 a:hover { color: var(--violet); }
.post-list-item p { color: var(--ink2); font-size: 0.95rem; }
.post-list-item .post-meta { margin: 0.4rem 0 0; }
.back-link { display: inline-block; margin-top: 3rem; color: var(--ink2); font-size: 0.875rem; }
footer { border-top: 0.5px solid var(--border-soft); padding: 1.75rem 2.5rem; text-align: center; color: var(--ink3); font-size: 0.8rem; }
</style>
</head>
<body>
<nav>
  <a class="logo-wrap" href="/">
    <div class="logo-mark"></div>
    <span class="logo-name">gabspace</span>
  </a>
  <a href="https://app.gabspace.io/get-started" class="btn btn-primary">Get started free</a>
</nav>
<main>
${bodyHtml}
</main>
<footer>© ${new Date().getFullYear()} Gabspace. All rights reserved. · <a href="/">gabspace.io</a></footer>
</body>
</html>`
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
