const level = require('level')

const db = level(__dirname + '/../cache.leveldb', {
  valueEncoding: 'json'
})

module.exports = db
