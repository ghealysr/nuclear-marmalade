import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import gsap from 'gsap'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.nuclearmarmalade.com'

interface PostData {
  post_id: number
  slug: string
  title: string
  subtitle?: string
  content_html?: string
  content?: string
  cover_image_url?: string
  author: string
  category?: string
  tags: string[]
  published_at?: string
  read_time_minutes?: number
  view_count?: number
  meta_title?: string
  meta_description?: string
}

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<PostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const articleRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!slug) return
    fetchPost(slug)
    window.scrollTo(0, 0)
  }, [slug])

  async function fetchPost(postSlug: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/blog/posts/${postSlug}`)
      if (res.status === 404) {
        setError('Post not found')
        return
      }
      if (!res.ok) throw new Error('Failed to fetch post')
      const data: PostData = await res.json()
      setPost(data)

      // Update page title
      document.title = `${data.meta_title || data.title} — Nuclear Marmalade`
    } catch (err) {
      console.error('Post fetch error:', err)
      setError('Failed to load dispatch')
    } finally {
      setLoading(false)
    }
  }

  // Entrance animation
  useEffect(() => {
    if (!loading && post && headerRef.current && articleRef.current) {
      const tl = gsap.timeline()
      tl.fromTo(
        headerRef.current.children,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' },
      )
      tl.fromTo(
        articleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
        '-=0.3',
      )
    }
  }, [loading, post])

  function formatDate(iso?: string) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-28 pb-20 px-6 sm:px-10">
        <div className="max-w-3xl mx-auto">
          <div className="blog-loading">
            <span className="blog-loading-dot" />
            <span>DECRYPTING TRANSMISSION...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-black pt-28 pb-20 px-6 sm:px-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="blog-empty">
            <span className="blog-empty-icon">⊘</span>
            <p className="text-amber-400 text-lg">{error || 'Dispatch not found'}</p>
            <Link to="/blog" className="blog-back-link mt-6 inline-block">
              ← RETURN TO DISPATCH LOG
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-28 pb-20 px-6 sm:px-10">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link to="/blog" className="blog-back-link">
          ← DISPATCH LOG
        </Link>

        {/* Header */}
        <div ref={headerRef} className="mt-8 mb-10">
          {/* Meta row */}
          <div className="blog-post-meta">
            {post.category && (
              <span className="blog-card-category">{post.category.toUpperCase()}</span>
            )}
            <span className="blog-card-date">{formatDate(post.published_at)}</span>
            {post.read_time_minutes && (
              <span className="blog-card-readtime">{post.read_time_minutes} min read</span>
            )}
            {post.view_count !== undefined && post.view_count > 0 && (
              <span className="blog-card-readtime">{post.view_count} views</span>
            )}
          </div>

          {/* Title */}
          <h1 className="blog-post-title">{post.title}</h1>

          {/* Subtitle */}
          {post.subtitle && (
            <p className="blog-post-subtitle">{post.subtitle}</p>
          )}

          {/* Author */}
          <div className="blog-post-author">
            <span className="blog-post-author-name">By {post.author}</span>
          </div>
        </div>

        {/* Cover image */}
        {post.cover_image_url && (
          <div className="blog-post-cover">
            <img
              src={post.cover_image_url}
              alt={post.title}
              loading="lazy"
            />
          </div>
        )}

        {/* Article content */}
        <article
          ref={articleRef}
          className="blog-article-content"
          dangerouslySetInnerHTML={{ __html: post.content_html || '' }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="blog-post-tags">
            {post.tags.map(tag => (
              <span key={tag} className="blog-card-tag">#{tag}</span>
            ))}
          </div>
        )}

        {/* Footer divider */}
        <div className="blog-post-footer">
          <div className="blog-post-divider" />
          <Link to="/blog" className="blog-back-link">
            ← RETURN TO DISPATCH LOG
          </Link>
        </div>
      </div>
    </div>
  )
}

export default BlogPost
