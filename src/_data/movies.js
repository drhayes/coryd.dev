import EleventyFetch from '@11ty/eleventy-fetch'

export default async function () {
  const TV_KEY = process.env.API_KEY_TRAKT
  const MOVIEDB_KEY = process.env.API_KEY_MOVIEDB
  const url = 'https://api.trakt.tv/users/cdransf/history/movies?page=1&limit=6&extended=full'
  const formatMovieData = (movies) => movies.map((item) => {
    const movie = {
      title: item['movie']['title'],
      dateAdded: item['watched_at'],
      url: `https://trakt.tv/movies/${item['movie']['ids']['slug']}`,
      id: item['movie']['ids']['trakt'],
      tmdbId: item['movie']['ids']['tmdb'],
      description: `${item['movie']['overview']}<br/><br/>`,
      tags: item['movie']['genres'],
      type: 'movie',
    }
    return movie;
  })

  const res = EleventyFetch(url, {
    duration: '1h',
    type: 'json',
    fetchOptions: {
      headers: {
        'Content-Type': 'application/json',
        'trakt-api-version': 2,
        'trakt-api-key': TV_KEY,
      },
    },
  }).catch()
  const data = await res
  const movies = formatMovieData(data)

  for (const movie of movies) {
    const tmdbId = movie['tmdbId']
    const tmdbUrl = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${MOVIEDB_KEY}`
    const tmdbRes = EleventyFetch(tmdbUrl, {
      duration: '1h',
      type: 'json',
    })
    const tmdbData = await tmdbRes
    const posterPath = tmdbData['poster_path']
    movie.image = `https://image.tmdb.org/t/p/w500/${posterPath}`
  }
  return movies;
}
