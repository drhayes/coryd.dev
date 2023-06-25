const { extract } = require('@extractus/feed-extractor')
const { AssetCache } = require('@11ty/eleventy-fetch')

module.exports = async function () {
  const url = 'https://oku.club/rss/collection/POaRa'
  // noinspection JSCheckFunctionSignatures
  const asset = new AssetCache('books_data')
  if (asset.isCacheValid('1h')) return await asset.getCachedValue()
  const res = await extract(url, {
    getExtraEntryFields: (feedEntry) => {
      return {
        image:
          feedEntry['oku:cover'] ||
          `https://cdn.coryd.dev/books/${feedEntry.title.replace(/\s+/g, '-').toLowerCase()}.jpg` ||
          'https://cdn.coryd.dev/books/missing-book.jpg',
      }
    },
  })
    .catch((error) => {
      console.log(error.message)
    })
    .catch()
  const data = res.entries
  await asset.save(data, 'json')
  return data
}
