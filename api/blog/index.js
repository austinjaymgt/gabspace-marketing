import { fetchPublishedPosts, pageShell, formatDate, escapeHtml } from '../../lib/blog.js'

const PAGE_SIZE = 12

export default async function handler(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const offset = (page - 1) * PAGE_SIZE

  let posts
  try {
    posts = await fetchPublishedPosts({ limit: PAGE_SIZE, offset })
  } catch (err) {
    res.status(502).send('Could not load posts.')
    return
  }

  const items = posts.map(p => `
<article class="post-list-item">
  <h2><a href="/blog/${p.slug}">${escapeHtml(p.title)}</a></h2>
  ${p.excerpt ? `<p>${escapeHtml(p.excerpt)}</p>` : ''}
  <div class="post-meta">${formatDate(p.published_at)}</div>
</article>`).join('\n')

  const pagerLinks = []
  if (page > 1) pagerLinks.push(`<a class="back-link" href="/blog${page - 1 > 1 ? `?page=${page - 1}` : ''}">&larr; Newer posts</a>`)
  if (posts.length === PAGE_SIZE) pagerLinks.push(`<a class="back-link" href="/blog?page=${page + 1}">Older posts &rarr;</a>`)

  const bodyHtml = `
<div class="eyebrow">Gabspace Blog</div>
<h1>The Gabspace Blog</h1>
${items || '<p>No posts yet — check back soon.</p>'}
<div style="display:flex; justify-content:space-between; margin-top:1rem;">${pagerLinks.join('')}</div>
`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')
  res.status(200).send(pageShell({
    title: 'Blog — Gabspace',
    description: 'Ideas, guides, and updates for creative entrepreneurs running their business with Gabspace.',
    canonicalPath: page > 1 ? `/blog?page=${page}` : '/blog',
    bodyHtml,
  }))
}
