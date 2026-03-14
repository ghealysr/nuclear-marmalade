import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.nuclearmarmalade.com'

interface BlogPost {
  post_id: number
  slug: string
  title: string
  subtitle?: string
  excerpt?: string
  cover_image_url?: string
  author: string
  category?: string
  tags: string[]
  published_at?: string
  read_time_minutes?: number
  view_count?: number
}

interface BlogResponse {
  posts: BlogPost[]
  total: number
}

const CATEGORIES = ['all', 'engineering', 'ai', 'design', 'business']

export function BlogIndex() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchPosts()
  }, [activeCategory])

  async function fetchPosts() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeCategory !== 'all') params.set('category', activeCategory)
      params.set('limit', '20')

      const res = await fetch(`${API_URL}/api/blog/posts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch posts')
      const data: BlogResponse = await res.json()
      setPosts(data.posts)
      setTotal(data.total)
    } catch (err) {
      console.error('Blog fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Entrance animation
  useEffect(() => {
    if (!loading && gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.blog-card')
      gsap.fromTo(
        cards,
        { opacity: 0, y: 40, filter: 'blur(4px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)',
          duration: 0.6, stagger: 0.08, ease: 'power3.out',
        },
      )
    }
  }, [loading, posts])

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current.children,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' },
      )
    }
  }, [])

  function formatDate(iso?: string) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-black pt-28 pb-20 px-6 sm:px-10">
      {/* Header */}
      <div ref={headerRef} className="max-w-5xl mx-auto mb-16">
        <div className="flex items-center gap-3 mb-4">
          <span className="blog-tag">SYS://BLOG</span>
          <span className="blog-tag-count">{total} ENTRIES</span>
        </div>
        <h1 className="blog-title">
          Dispatch<span className="blog-title-accent">Log</span>
        </h1>
        <p className="blog-subtitle">
          Engineering intelligence. Field notes from the build.
        </p>

        {/* Category filters */}
        <div className="flex gap-2 mt-8 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`blog-filter ${activeCategory === cat ? 'blog-filter-active' : ''}`}
            >
              {cat === 'all' ? 'ALL' : cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="max-w-5xl mx-auto">
          <div className="blog-loading">
            <span className="blog-loading-dot" />
            <span>LOADING TRANSMISSIONS...</span>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="max-w-5xl mx-auto">
          <div className="blog-empty">
            <span className="blog-empty-icon">◇</span>
            <p>No dispatches found.</p>
            <p className="text-zinc-600 text-sm mt-1">Check back soon — transmissions incoming.</p>
          </div>
        </div>
      ) : (
        <div ref={gridRef} className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map(post => (
            <Link
              key={post.post_id}
              to={`/blog/${post.slug}`}
              className="blog-card group"
            >
              {/* Cover image */}
              {post.cover_image_url && (
                <div className="blog-card-image">
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    loading="lazy"
                  />
                </div>
              )}

              <div className="blog-card-body">
                {/* Meta row */}
                <div className="blog-card-meta">
                  {post.category && (
                    <span className="blog-card-category">{post.category.toUpperCase()}</span>
                  )}
                  <span className="blog-card-date">{formatDate(post.published_at)}</span>
                  {post.read_time_minutes && (
                    <span className="blog-card-readtime">{post.read_time_minutes} min read</span>
                  )}
                </div>

                {/* Title */}
                <h2 className="blog-card-title">{post.title}</h2>

                {/* Subtitle */}
                {post.subtitle && (
                  <p className="blog-card-subtitle">{post.subtitle}</p>
                )}

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="blog-card-excerpt">{post.excerpt}</p>
                )}

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="blog-card-tags">
                    {post.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="blog-card-tag">#{tag}</span>
                    ))}
                  </div>
                )}

                {/* Read more arrow */}
                <div className="blog-card-arrow">
                  READ DISPATCH →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default BlogIndex
