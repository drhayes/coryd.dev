export default async function () {
  const { ActivityFeed } = await import('@11ty/eleventy-activity-feed')
  const feed = new ActivityFeed()

  feed.addSource('rss', '📝', 'https://coryd.dev/feeds/posts')
  feed.addSource('rss', '🎥', 'https://coryd.dev/feeds/movies')
  feed.addSource('rss', '📖', 'https://coryd.dev/feeds/books')
  feed.addSource('rss', '🔗', 'https://coryd.dev/feeds/links')
  feed.addSource('rss', '🎧', 'https://coryd.dev/feeds/weekly-artist-chart')

  const entries = feed.getEntries().catch()
  const res = await entries
  const activity = { posts: [] }
  res.forEach((entry) => {
    activity.posts.push({
      id: entry.url,
      title: entry.title,
      url: entry.url,
      description: entry.content,
      content_html: entry.content,
      date_published: entry.published,
    })
  })

  return activity
}