import chalk from 'chalk'
import NCM from 'cache-manager'
import { log } from './logger'

let internalCaches = []
let instance = null
let cacheConfig

export default class CacheManager {
  constructor() {
    if (instance) {
      return instance
    }
    this.clearAll = this.clearAll.bind(this)
    this.createCache = this.createCache.bind(this)
    this.instance = this
  }

  createCache(name) {
    cacheConfig = {
      store: 'memory',
      max: parseInt(process.env.CACHE_MAX_ITEM_COUNT, 10) || 100,
      ttl: parseInt(process.env.CACHE_MAX_AGE, 10) || 1
    }

    if (process.env.REDIS_URL) {
      const redisStore = require('cache-manager-redis-store')
      cacheConfig = {
        store: redisStore,
        url: process.env.REDIS_URL
      }
    }

    internalCaches[name] = NCM.caching(cacheConfig)
    return internalCaches[name]
  }

  clearAll() {
    if (internalCaches) {
      internalCaches.forEach(async cache => {
        log.debug(`Cache reset in ${chalk.green(cache)}`)
        await cache.reset()
      })
    }
  }

  getCache(name) {
    return internalCaches[name]
  }

  async clearCache(cacheName, keyName) {
    log.debug(
      `Cache cleared ${chalk.green(keyName)} in ${chalk.green(cacheName)}`
    )

    await internalCaches[cacheName].del(keyName)
  }
}
