/**
 * GET url
 *
 * 缓存 response
 * 1 使用缓存
 *    1.1 检查 expired，这是默认情况 (cache = 1)
 *    1.2 不检查 expired (cache = 2)
 * 2 不使用缓存，不检查 expired (cache = 0)
 *
 */

const got = require('got')
const chalk = require('chalk')
const db = require('./db')

const options = {
  cache: 1,
  timespan: 24 * 3600 * 1000, // one day
  got: {
    timeout: 30000,
    followRedirect: false
  }
}

/**
 * @param {string} url
 * @return {object}
 */
async function get(url) {
  /**
   * cache
   */

  // 为方便处理，使用空对象而不是 null
  let data = {}
  try {
    const data = await db.get(url)
    if (options.cache === 1) {
      if (Date.now() - data.savedAt < options.timespan) return data
    } else if (options.cache === 2) {
      return data
    }
  } catch (err) {
    if (err.notFound) {
      if (options.cache === 2) {
        console.error(chalk.red('Not found in cache: %s'), url)
        return data
      }
    } else {
      throw err
    }
  }

  /**
   * request
   */

  const gotOptions = options.got
  if ('content' in data) {
    gotOptions.headers = {
      'If-Modified-Since': data.lastModified
    }
  }

  let res
  try {
    console.log('GET', url)
    res = await got(url, gotOptions)
  } catch (err) {
    // cache 404
    const { statusCode } = err
    if (statusCode) {
      console.error(chalk.red('%d %s'), err.statusCode, url)
      data = {
        statusCode,
      }
      if (statusCode === 404) {
        save(url, data)
      }
      return data
    }
    throw err
  }

  const { statusCode } = res

  if (statusCode === 304) {
    save(url, data)
    return data
  }

  // cache 3xx
  if (statusCode > 299 & statusCode < 400) {
    console.log(chalk.red('%d %s'), statusCode, url)
    console.log(chalk.red('%d %s'), '-->', res.headers['location'])
    data = {
      location: res.headers['location'],
      statusCode,
    }
  } else {
    data = {
      content: res.body,
      lastModified: res.headers['last-modified'],
    }
  }

  // no await
  save(url, data)
  return data
}

function save(key, data) {
  data.savedAt = Date.now()
  db.put(key, data)
}

module.exports = get
module.exports.options = options
