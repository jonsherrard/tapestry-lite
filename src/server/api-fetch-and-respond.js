import fetcher from '../shared/fetcher'
import { log } from '../utilities/logger'
import chalk from 'chalk'

const AFAR = (url, allowEmptyResponse = false) => {
  return fetcher(url)
    .then(resp => {
      if (!resp.ok) {
        throw {
          // Fetch library properties
          name: 'FetchError',
          type: 'http-error',
          // Traditional request properties
          status: resp.status,
          statusText: resp.statusText,
          // Tapestry properties
          message: resp.statusText,
          code: resp.status
        }
      } else {
        return resp
      }
    })
    .then(resp => resp.json())
    .then(apiData => {
      if ((apiData.length == false) && (allowEmptyResponse !== true)) {
        throw {
          name: 'FetchError',
          type: 'http-error',
          statusText: 'WP-API returned no results',
          message: 'WP-API returned no results and empty results are not allowed on this route',
          code: 404
        }
      } else {
        return apiData
      }
    })
}

export default AFAR
