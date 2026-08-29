import { fetchPublishedPosts } from '../lib/blog.js'

const SITE_URL = 'https://gabspace.io'

const STATIC_PATHS = ['/', '/blog', '/privacy.html', '/cookies.html', '/acceptable-use.html', '/subprocessors.html']

export default async function handler(req, res) {
  let posts = []
  try {
    posts = await fetchPublishedPosts({ limit: 1000, offset: 0 })
  } catch (err) {
    // Fall back to just the static pages rather than failing the whole sitemap.
  }

  const urls = [
    ...STATIC_PATHS.map(path => ({ loc: `${SITE_URL}${path}` })),
    ...posts.map(p => ({ loc: `${SITE_URL}/blog/${p.slug}`, lastmod: p.published_at })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
${u.lastmod ? `    <lastmod>${new Date(u.lastmod).toISOString().slice(0, 10)}</lastmod>\n` : ''}  </url>`).join('\n')}
</urlset>`

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(xml)
}
