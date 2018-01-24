const fs = require('fs-extra')
const got = require('got')
const writeFile = require('./write-file')
const chalk = require('chalk')

module.exports = async function (url, file, opts = {}) {
  if (!opts.overwrite) {
    if (await fs.pathExists(file)) {
      if (opts.verbose) console.log('File exists:', file)
      return
    }
  }

  console.log('GET', url)
  return new Promise((resolve, reject) => {
    const r = got.stream(url, opts)
    r.on('response', async res => {
      const w = await writeFile(file)
      r.pipe(w)
        .on('close', resolve)
    })
    r.on('error', reject)
  })
    .catch(err => {
      if (err.statusCode) {
        console.error(chalk.red('%d %s'), err.statusCode, err.url)
      } else {
        throw err
      }
    })
}
