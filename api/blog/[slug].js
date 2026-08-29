import { fetchPostBySlug, renderMarkdown, pageShell, formatDate, escapeHtml } from '../../lib/blog.js'

export default async function handler(req, res) {
  const { slug } = req.query
  let post
  try {
    post = await fetchPostBySlug(slug)
  } catch (err) {
    res.status(502).send('Could not load post.')
    return
  }

  if (!post) {
    res.status(404)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(pageShell({
      title: 'Post not found — Gabspace Blog',
      description: 'This post could not be found.',
      canonicalPath: `/blog/${slug}`,
      bodyHtml: `<div class="eyebrow">Gabspace Blog</div><h1>Post not found</h1><p>This post may have been unpublished or moved.</p><a class="back-link" href="/blog">&larr; Back to the blog</a>`,
    }))
    return
  }

  const title = post.seo_title || post.title
  const description = post.seo_description || post.excerpt || ''
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    datePublished: post.published_at,
    dateModified: post.published_at,
    image: post.cover_image_url || undefined,
    url: `https://gabspace.io/blog/${post.slug}`,
    author: { '@type': 'Organization', name: 'Gabspace' },
    publisher: { '@type': 'Organization', name: 'Gabspace' },
  }

  const bodyHtml = `
<div class="eyebrow">Gabspace Blog</div>
<h1>${escapeHtml(post.title)}</h1>
<div class="post-meta">${formatDate(post.published_at)}</div>
${post.cover_image_url ? `<img class="post-cover" src="${escapeHtml(post.cover_image_url)}" alt="${escapeHtml(post.title)}"/>` : ''}
<div class="post-body">${renderMarkdown(post.content)}</div>
<a class="back-link" href="/blog">&larr; Back to the blog</a>
`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')
  res.status(200).send(pageShell({ title, description, canonicalPath: `/blog/${post.slug}`, ogImage: post.cover_image_url, jsonLd, bodyHtml }))
}
