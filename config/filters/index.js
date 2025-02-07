import { DateTime } from 'luxon'
import { URL } from 'url'
import slugify from 'slugify'
import sanitizeHtml from 'sanitize-html';
import authors from '../data/author-map.js'

const utmPattern = /[?&](utm_[^&=]+=[^&#]*)/gi
const BASE_URL = 'https://coryd.dev'

export default {
  // general
  btoa: (string) => {
    return btoa(string)
  },
  encodeAmp: (string) => {
    if (!string) return
    const pattern = /&(?!(?:[a-zA-Z]+|#[0-9]+|#x[0-9a-fA-F]+);)/g
    const replacement = '&amp;'
    return string.replace(pattern, replacement)
  },
  stripUtm: (string) => {
    if (!string) return
    return string.replace(utmPattern, '')
  },
  replaceQuotes: (string) => string.replace(/"/g, "'"),
  slugifyString: (str) => {
    return slugify(str, {
      replacement: '-',
      remove: /[#,&,+()$~%.'":*?<>{}]/g,
      lower: true,
    })
  },

  // navigation
  isLinkActive: (category, page) => {
    const normalizedPage = page.includes('.html') ? page.replace('.html', '/') : page
    return !!normalizedPage && normalizedPage.includes(category) && !/\d+/.test(normalizedPage);
  },
  isPost: (url) => {
    if (url.includes('post')) return true;
    return false
  },

  // analytics
  getPopularPosts: (posts, analytics) => {
    return posts
      .filter((post) => {
        if (analytics.find((p) => p.url.includes(post.url))) return true
      })
      .sort((a, b) => {
        const visitors = (page) => analytics.filter((p) => p.url.includes(page.url)).pop().value
        return visitors(b) - visitors(a)
      })
  },
  tagLookup: (url, tagMap) => {
    if (!url) return
    if (url.includes('openlibrary.org')) return `#Books #NowReading ${tagMap[url]}`.trim()
    if (url.includes('trakt.tv')) return `#Movies #Watching  ${tagMap[url]}`.trim()
    return tagMap[url] || ''
  },

  // posts
  filterByPostType: (posts, postType) => {
    if (postType === 'featured') return posts.filter(post => post.data.featured === true).splice(0, 3)
    return posts.slice(0, 5)
  },
  truncateByWordCount: (text, wordCount) => {
    const words = sanitizeHtml(text, { allowedTags: ['']}).split(/\s+/);
    if (words.length > wordCount) return `<p>${words.slice(0, wordCount).join(' ').replace(/[^a-zA-Z0-9]+$/, '')}...</p>`
    return text
  },

  // authors
  authorLookup: (url) => {
    if (!url) return null
    const urlObject = new URL(url)
    const baseUrl = urlObject.origin
    return authors?.[baseUrl] || null
  },

  // dates
  readableDate: (date) => {
    return DateTime.fromISO(date).toFormat('LLLL d, yyyy')
  },
  isoDateOnly: (date, separator) => {
    let d = new Date(date)
    let month = '' + (d.getMonth() + 1)
    let day = '' + d.getDate()
    let year = d.getFullYear()

    if (month.length < 2) month = '0' + month
    if (day.length < 2) day = '0' + day

    return [year, month, day].join(separator)
  },
  stringToDate: (string) => {
    if (!string) return
    return new Date(string)
  },
  oldPost: (date) => {
    return DateTime.now().diff(DateTime.fromJSDate(new Date(date)), 'years').years > 3;
  },
  stringToRFC822Date: (dateString) => {
    const addLeadingZero = (num) => {
      num = num.toString();
      while (num.length < 2) num = "0" + num;
      return num;
    }
    const dayStrings = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthStrings = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const timeStamp = Date.parse(dateString);
    const date = new Date(timeStamp);
    const day = dayStrings[date.getDay()];
    const dayNumber = addLeadingZero(date.getDate());
    const month = monthStrings[date.getMonth()];
    const year = date.getFullYear();
    const time = `${addLeadingZero(date.getHours())}:${addLeadingZero(date.getMinutes())}:00`;
    const timezone = date.getTimezoneOffset() === 0 ? "GMT" : "PT";

    return `${day}, ${dayNumber} ${month} ${year} ${time} ${timezone}`;
  },

  // links
  findPost: (url, posts) => {
    if (!url || !posts || !posts[url]?.toots?.[0]?.includes('https')) return null;
    const BASE_URL = 'https://social.lol/users/cory/statuses/'
    const STATUS_URL = 'https://social.lol/@cory/'
    return posts[url]?.toots?.[0]?.replace(BASE_URL, STATUS_URL) || null;
  },
  absoluteUrl: (url) => {
    try {
      return (new URL(url, BASE_URL)).toString()
    } catch(e) {
      console.log('Error generating absoluteUrl.')
    }
    return url;
  },

  // feeds
  normalizeEntries: (entries) => {
    const posts = []
    entries.forEach((entry) => {
      const dateKey = Object.keys(entry).find((key) => key.includes('date'))
      const date = new Date(entry[dateKey])
      let excerpt = ''
      let url = ''
      const feedNote = '<hr/><p>This is a full text feed, but not all content can be rendered perfeclty within the feed. If something looks off, feel free to <a href="https://coryd.dev">visit my site</a> for the original post.</p>'

      // set the entry url
      if (entry.url.includes('http')) url = entry.url
      if (!entry.url.includes('http')) url = new URL(entry.url, BASE_URL).toString()
      if (entry?.data?.link) url = entry.data.link

      // set the entry excerpt
      if (entry.description) excerpt = entry.description // general case
      if (entry?.data?.description) excerpt = `${entry?.data?.description}<br/><br/>` // links where description is stored in frontmatter
      if (entry.type === 'book') excerpt = `${entry.description}<br/><br/>` // books

      // send full post content to rss
      if (entry.content) excerpt = sanitizeHtml(`${entry.content}${feedNote}`, {
        disallowedTagsMode: 'completelyDiscard'
      })

      // if there's a valid entry return a normalized object
      if (entry)
        posts.push({
          title: entry.data?.title || entry.title,
          url,
          content: entry?.description || entry?.data?.description,
          date,
          excerpt,
        })
    })
    return posts
  },

  // media
  normalizeMedia: (media) =>
    media.map((item) => {
      let normalized = {
        image: item['image'],
        url: item['url'],
        type: item.type
      }
      if (item.type === 'album') {
        normalized['title'] = item['title']
        normalized['alt'] = `${item['title']} by ${item['artist']}`
        normalized['subtext'] = `${item['artist']}`
      }
      if (item.type === 'artist') {
        normalized['title'] = item['title']
        normalized['alt'] = `${item['plays']} plays of ${item['title']}`
        normalized['subtext'] = `${item['plays']} plays`
      }
      if (item.type === 'movie') normalized['alt'] = item['title']
      if (item.type === 'book') {
        normalized['alt'] = `${item['title']} by ${item['authors']}`
        normalized['subtext'] = `${item['percentage']} finished`
        normalized['percentage'] = item['percentage']
      }
      if (item.type === 'tv') {
        normalized['title'] = item['title']
        normalized['alt'] = `${item['title']} from ${item['name']}`
        normalized['subtext'] = item['subtext']
      }
      if (item.type === 'tv-range') {
        normalized['title'] = item['name']
        normalized['alt'] = `${item['subtext']} from ${item['name']}`
        normalized['subtext'] = item['subtext']
      }
      return normalized
    }),
  calculatePlayPercentage: (plays, mostPlayed) => `${plays/mostPlayed * 100}%`,
  bookStatus: (books, status) => books.filter(book => book.status === status),
  bookFinishedYear: (books, year) => books.filter(book => {
    if (book.status === 'finished' && book.dateAdded) return parseInt(book.dateAdded.split('-')[0]) === year
    return ''
  }).sort((a, b) => {
    const dateA = DateTime.fromISO(a.dateAdded)
    const dateB = DateTime.fromISO(b.dateAdded)
    return dateB - dateA
  }),
  currentBookCount: (books) => {
    const year = DateTime.now().year
    return books.filter(book => {
      if (book.status === 'finished' && book.dateAdded) return parseInt(book.dateAdded.split('-')[0]) === year
      return ''
    }).length
  },

    // tags
  filterTags: (tags) => {
    return tags.filter((tag) => tag.toLowerCase() !== 'posts')
  },
  formatTag: (string) => {
    const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1)
    const normalizedString = string.toLowerCase()
    if (
      normalizedString === 'ios' ||
      normalizedString === 'macos' ||
      normalizedString === 'css' ||
      normalizedString === 'rss' ||
      normalizedString === 'ai'
    ) return `#${string}`
    if (!string.includes(' ')) return `#${capitalizeFirstLetter(string)}`
    return `#${string.split(' ').map(s => capitalizeFirstLetter(s)).join('')}`
  }
}
