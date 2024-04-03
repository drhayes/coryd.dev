import { getStore } from '@netlify/blobs'

export default async (request) => {
  const API_KEY_MUSIC = Netlify.env.get('API_KEY_MUSIC');
  const params = new URL(request['url']).searchParams
  const key = params.get('key')
  const week = params.get('week')

  if (!key) return new Response(JSON.stringify({
      status: 'Bad request',
    }),
    { headers: { "Content-Type": "application/json" } }
  )

  if (key !== API_KEY_MUSIC) return new Response(JSON.stringify({
      status: 'Forbidden',
    }),
    { headers: { "Content-Type": "application/json" } }
  )

  const scrobbles = getStore('scrobbles')
  const scrobbleData = []
  const artists = getStore('artists')
  const albums = getStore('albums')
  const artistsMap = await artists.get('artists-map', { type: 'json' })
  const albumsMap = await albums.get('albums-map', { type: 'json' })
  const nowPlaying = await scrobbles.get('now-playing', { type: 'json'})

  if (week) {
    const weekData = await scrobbles.get(week, { type: 'json'})
    scrobbleData.push(...weekData['data'])
  } else {
    const windowData = await scrobbles.get('window', { type: 'json'})
    scrobbleData.push(...windowData['data'])
  }

  return new Response(JSON.stringify({
    scrobbles: scrobbleData,
    nowPlaying,
    artists: artistsMap,
    albums: albumsMap
  }),
    { headers: { "Content-Type": "application/json" } }
  )
}

export const config = {
  path: '/api/music',
}