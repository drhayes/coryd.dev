import EleventyFetch from '@11ty/eleventy-fetch'

export default async function () {
  const url = 'https://api.omg.lol/address/cory/statuses/'
  const res = EleventyFetch(url, {
    duration: '1h',
    type: 'json',
  }).catch()
  const status = await res

  return status.response['statuses'][0]
}
